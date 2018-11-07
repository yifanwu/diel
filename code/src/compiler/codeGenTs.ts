import * as stream from "stream";
import { DielIr, RelationIr, DerivedRelationIr, DataType } from "../parser/dielTypes";
import { RelationTs, RelationType } from "../lib/dielUtils";
import * as fmt from "typescript-formatter";


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

function generateInputDelcaration(i: RelationIr) {
  return `${i.name}: (val: {${i.columns.map(c => `${c.name}: ${dataTypeToTypeScript(c.type)}`).join(", ")}}) => void`;
}

function generateInput(i: RelationIr) {
    return `${i.name}: (val: {${i.columns.map(c => `${c.name}: ${dataTypeToTypeScript(c.type)}`).join(", ")}}) => {
      this.input.${i.name}(val);
    }`;
}

function generateView(v: DerivedRelationIr) {
  const checkNull = v.isNullable ? "" : `if (r.length === 0) {
    throw new Error(${v.name} should not be null);
  }`;
  const returnStmt = v.isSingle
    ? `if (r.length > 1) throw new Error (${v.name} should have single value);
        return r[0];`
    : `return r`;

  return `${v.name}: () => {
    this.view.${v.name}.bind({});
    let r = [];
    while (s.step()) {
      r.push(s.getAsObject());
    }
    ${checkNull}
    ${returnStmt}
  }`;
}

function generateDependencies(ir: DielIr) {
  // build the graph of read/write dependencies
  // ir.outputs.map
  // for each output, look at its inputs
  const inputDependency = new Map<string, string[]>();
  ir.outputs.map(o => {
    [o.selectBody.fromRelation, ...o.selectBody.joinRelations].map(r => {
      if (inputDependency.has(r)) {
        inputDependency.get(r).push(o.name);
      } else {
        inputDependency.set(r, [o.name]);
      }
    });
  });
  return inputDependency;
}

function generateDepMapString(m: Map<string, string[]>) {
  let strings: string[] = [];
  for (let [key, value] of m.entries()) {
    strings.push(`[${key}, [${value.join(", ")}]]`);
  }
  return `[${strings.join(", ")}]`;
}

function generateStatementDeclarations(ir: DielIr) {
  const genDeclaration = (a: (RelationIr | DerivedRelationIr)[]) => a.map(o => `${o.name}: Statement;`).join("\n");
  return `
    private input = {${genDeclaration(ir.inputs)}};
    private output = {${genDeclaration(ir.outputs)}};
    private view = {${genDeclaration(ir.views)}};
    private dynamicTable = {${genDeclaration(ir.tables.filter(o => o.isDynamic))}};
  `;
}
function generateStatements(ir: DielIr) {
  const genPrep = (a: RelationTs[]) => a.map(o => `${o.name}: this.db.prepare(\`${o.query}\`);`).join("\n");
  const inputArray = createInputTs(ir.inputs);
  const outputArray = createOutputTs(ir.outputs);
  const viewArray = createViewsTs(ir.views);
  const dynamicTable = createDynamicTableTs(ir.tables);
  return `
    this.input = {${genPrep(inputArray)}};
    this.output = {${genPrep(outputArray)}};
    this.view = {${genPrep(viewArray)}};
    this.dynamicTable = {${genPrep(dynamicTable)}};
  `;
}

function generateBindOutputDeclaration(o: DerivedRelationIr) {
  return `${o.name}: (f: OutputBoundFunc) => void;`;
}

function generateGetViewDeclaration(o: DerivedRelationIr) {
  // do some casting
  return `${o.name}: () => {${o.columns.map(c => `${c.name}: ${dataTypeToTypeScript(c.type)}`)}}[]`;
}

function generateApiDeclaration(ir: DielIr) {
  return `
    public NewInput: {${ir.inputs.map(generateInputDelcaration)}};
    public TableInput: {${ir.tables.filter(t => t.isDynamic).map(generateInputDelcaration)}};
    public BindOutput: {${ir.outputs.map(generateBindOutputDeclaration)};
    public GetView: {${ir.views.filter(v => v.isPublic).concat(ir.outputs).map(generateGetViewDeclaration)}};
  `;
}

function generateApi(ir: DielIr) {
  return `
    this.NewInput = {${ir.inputs.map(generateInput)}};
    this.TableInput = {${ir.tables.filter(t => t.isDynamic).map(generateInput)}};
    this.BindOutput = {
        ${ir.outputs.map(o => `${o.name}: (f: OutputBoundFunc) => {
          this.sideEffects["${o.name}"] = () => {
            const r = this.GetView.${o.name}();
            f(r);
          };
        }`)}
      }
    this.GetView = {
        ${ir.views.filter(v => v.isPublic).concat(ir.outputs).map(generateView)}
      }
    }`;
}

function generateDiel(ir: DielIr) {
  const dependencies = generateDepMapString(generateDependencies(ir));

  return `
import { Statement } from "sql.js";
import { loadDbHelper, OutputBoundFunc } from "diel";

export class Diel {
  dbPath: string;
  sideEffects: {{[index: string]: () => void};
  ${generateStatementDeclarations(ir)}
  ${generateApiDeclaration(ir)}
  constructor(dbPath: string) {
    LogInfo("DIEL initializing");
    this.dbPath = dbPath;
    this.sideEffects = {};
  }
  public async Setup() {
    await this.LoadDb(path);
    ${generateStatements(ir)}
    ${generateApi(ir)}
  }
  public async LoadDb(file: string) {
    loadDbHelper(this.db, file, this.tick);
  }
  private tick() {
    const sideEffects = this.sideEffects;
    const dependencies = new Map<string, string[]>(${dependencies});;
    return (input: string) => {
      const updates = dependencies.get(input);
      updates.map(u => sideEffects[u]());
    };
  }
}`;
}

function createInputTs(ins: RelationIr[]): RelationTs[] {
  return ins.map(r => ({
    // relationType: RelationType.Input,
    name: r.name,
    query: `
    insert into ${r.name} (timestep, timestamp, ${r.columns.map(c => c.name).join(", ")})
      select max(timestep), timeNow(), ${r.columns.map(c => c.name).map(v => `$${v}`).join(", ")}
      from allInputs;`
  }));
}

function createDynamicTableTs(tables: RelationIr[]): RelationTs[] {
  return tables.filter(t => t.isDynamic).map(t => ({
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

export async function genTs(ir: DielIr) {
  const rawText = generateDiel(ir);
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
  return t;
}