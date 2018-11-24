import * as fs from "fs";
import * as stream from "stream";
import { DielAst, DynamicRelationIr, DerivedRelationIr, DataType } from "../parser/dielAstTypes";
import { RelationTs, RelationType } from "../lib/dielUtils";
import * as fmt from "typescript-formatter";
import { LogInternalError } from "../lib/messages";


function dataTypeToTypeScript(t: DataType) {
  switch (t) {
    case DataType.String:
      return "string";
    case DataType.Boolean:
      return "boolean";
    case DataType.Number:
      return "number";
    default:
      throw new Error(`Diel DataType ${t} is not defined for Typescript`);
  }
}

function generateInputDelcaration(i: DynamicRelationIr) {
  return `${i.name}: (val: {${i.columns.map(c => `${c.name}: ${dataTypeToTypeScript(c.type)}`).join(", ")}}) => void`;
}

function generateInput(i: DynamicRelationIr) {
    return `${i.name}: (val: {${i.columns.map(c => `${c.name}: ${dataTypeToTypeScript(c.type)}`).join(", ")}}) => {
      this.input.${i.name}.run(val);
    }`;
}

function generateView(v: DerivedRelationIr) {
  const checkNull = v.isNullable ? "" : `if (r.length === 0) {
    throw new Error(${v.name} should not be null);
  }`;
  const returnStmt = v.isSingle
    ? `if (r.length > 1) throw new Error (${v.name} should have single value);
        return r[0];`
    : `return r;`;

  return `${v.name}: () => {
    const s = this.view.${v.name};
    s.bind({});
    let r = [];
    while (s.step()) {
      r.push(s.getAsObject());
    }
    ${checkNull}
    ${returnStmt}
  }`;
}

function generateDependencies(ir: DielAst) {
  // build the graph of read/write dependencies
  // ir.outputs.map
  // for each output, look at its inputs
  const inputDependency = new Map<string, string[]>();
  ir.outputs.map(o => {
    o.selectBody.relations.map(r => {
      if (inputDependency.has(r.name)) {
        inputDependency.get(r.name).push(o.name);
      } else {
        inputDependency.set(r.name, [o.name]);
      }
    });
  });
  return inputDependency;
}

function generateDepMapString(m: Map<string, string[]>) {
  let strings: string[] = [];
  for (let [key, value] of m.entries()) {
    strings.push(`["${key}", [${value.map(v => `"${v}"`).join(", ")}]]`);
  }
  return `[${strings.join(", ")}]`;
}

function generateStatements(ir: DielAst) {
  const genPrep = (a: RelationTs[]) => a.map(o => `${o.name}: this.db.prepare(\`${o.query}\`)`).join(",\n");
  const genDeclaration = (a: (DynamicRelationIr | DerivedRelationIr)[]) => a.map(o => `${o.name}: Statement,`).join("\n");
  console.log("genDeclaration of inputs", genDeclaration(ir.inputs));
  let assignment: string[] = [];
  let declaration: string[] = [];
  if (ir.inputs.length > 0) {
    declaration.push(`private input: {${genDeclaration(ir.inputs)}};`);
    assignment.push(`this.input = {${genPrep(createInputTs(ir.inputs))}};`);
  }
  const allViews = ir.views.concat(ir.outputs);
  if (allViews.length > 0) {
    declaration.push(`private view: {${genDeclaration(allViews)}};`);
    assignment.push(`this.view = {${genPrep(createOutputTs(allViews))}};`);
  }
  if (ir.dynamicTables.length > 0) {
    declaration.push(`private dynamicTable: {${genDeclaration(ir.dynamicTables)}};`);
    assignment.push(`this.dynamicTable = {${genPrep(createDynamicTableTs(ir.dynamicTables))}};`);
  }
  return {
    declaration,
    assignment
  };
}

function generateBindOutputDeclaration(o: DerivedRelationIr) {
  return `${o.name}: (f: OutputBoundFunc) => void`;
}

function generateGetViewDeclaration(o: DerivedRelationIr) {
  // do some casting
  return `${o.name}: () => {${o.columns.map(c => `${c.columnName}: ${dataTypeToTypeScript(c.type)}`)}}[]`;
}

function generateBindOutput(o: DerivedRelationIr) {
  return `${o.name}: (f: OutputBoundFunc) => {
    this.sideEffects["${o.name}"] = () => {
      const r = this.GetView.${o.name}();
      f(r);
    };
  }`;
}

function generateApi(ir: DielAst) {
  let assignment: string[] = [];
  let declaration: string[] = [];
  if (ir.inputs.length > 0) {
    declaration.push(`public NewInput: {${ir.inputs.map(generateInputDelcaration).join(",\n")}};`);
    assignment.push(`this.NewInput = {${ir.inputs.map(generateInput)}};`);
  }
  if (ir.dynamicTables.length > 0) {
    declaration.push(`public TableInput: {${ir.dynamicTables.map(generateInputDelcaration).join(",\n")}};`);
    assignment.push(`this.TableInput = {${ir.dynamicTables.map(generateInput)}};`);
  }
  if (ir.outputs.length > 0) {
    declaration.push(`public BindOutput: {${ir.outputs.map(generateBindOutputDeclaration).join(",\n")}};`);
    assignment.push(`this.BindOutput = {${ir.outputs.map(generateBindOutput)}};`);
  }
  const pubViews = ir.views.filter(v => v.isPublic).concat(ir.outputs);
  if (pubViews.length > 0) {
    declaration.push(`public GetView: {${pubViews.map(generateGetViewDeclaration).join("\n")}};`);
    assignment.push(`this.GetView = {${pubViews.map(generateView)}};`);
  }
  return {
    declaration,
    assignment
  };
}

function generateDiel(ir: DielAst) {
  const dependencies = generateDepMapString(generateDependencies(ir));
  const statements = generateStatements(ir);
  const apis = generateApi(ir);
  return `
import { Database, Statement } from "sql.js";
import { loadDbHelper, OutputBoundFunc, LogInfo } from "diel";

export class Diel {
  private db: Database;
  private workers: Worker[];
  private dbPath: string;
  private sideEffects: {[index: string]: () => void};
  ${statements.declaration.join("\n")}
  ${apis.declaration.join("\n")}
  constructor(dbPath: string) {
    LogInfo("DIEL initializing");
    this.dbPath = dbPath;
    this.sideEffects = {};
  }
  public async Setup() {
    await this.LoadDb(this.dbPath);
    ${statements.assignment.join("\n")}
    ${apis.assignment.join("\n")}
  }
  public async LoadDb(file: string) {
    loadDbHelper(this.db, file, this.tick);
  }
  private tick() {
    const sideEffects = this.sideEffects;
    const dependencies = new Map<string, string[]>(${dependencies});
    return (input: string) => {
      const updates = dependencies.get(input);
      updates.map(u => sideEffects[u]());
    };
  }
}`;
}

function createInputTs(ins: DynamicRelationIr[]): RelationTs[] {
  return ins.map(r => ({
    // relationType: RelationType.Input,
    name: r.name,
    query: `
    insert into ${r.name} (timestep, timestamp, ${r.columns.map(c => c.name).join(", ")})
      select max(timestep), timeNow(), ${r.columns.map(c => c.name).map(v => `$${v}`).join(", ")}
      from allInputs;`
  }));
}

function createDynamicTableTs(tables: DynamicRelationIr[]): RelationTs[] {
  return tables.map(t => ({
    // relationType: RelationType.Table,
    name: t.name,
    query: `insert into ${t.name} (${t.columns.map(c => c.name).join(", ")})`
  }));
}

function createOutputTs(outs: DerivedRelationIr[]): RelationTs[] {
  return outs.map(r => ({
    // relationType: RelationType.Output,
    name: r.name,
    query: `select * from ${r.name};`
  }));
}

function createViewsTs(views: DerivedRelationIr[]): RelationTs[]  {
  return views.filter(v => v.isPublic).map(r => ({
    // relationType: RelationType.View,
    name: r.name,
    query: `select * from ${r.name};`
  }));
}

export async function genTs(ir: DielAst) {
  const rawText = generateDiel(ir);
  fs.writeFileSync("tmpUnformatted.ts", rawText);
  let input = new stream.Readable();
  input.push(rawText);
  input.push(null);
  const formatConfig: fmt.Options = {
    dryRun: true,
    replace: false,
    verify: false,
    tsconfig: true,
    tsconfigFile: null,
    tslint: true,
    tslintFile: null,
    editorconfig: true,
    vscode: true,
    vscodeFile: null,
    tsfmt: true,
    tsfmtFile: null,
  };
  const t = await fmt.processStream("tmp.ts", input, formatConfig);
  if (t.error) {
    LogInternalError(`Formatting TypeScript Failed with error ${t.message}`);
  }
  // console.log("Pretty print TS", t.dest);
  return t.dest;
}