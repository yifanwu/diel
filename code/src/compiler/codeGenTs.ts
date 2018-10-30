import { DielIr, RelationIr, DerivedRelationIr, DataType } from "../parser/dielTypes";
import { RelationTs } from "../lib/dielUtils";

function generateStmts(inputArray: RelationTs[], outputArray: RelationTs[], viewArray: RelationTs[]) {
  // generate objects for inputs based on their schema
  const dielOutput = outputArray.length > 0
    ? `export enum DielOutput {\n${outputArray.map(i => `${i.name} = "${i.name}"`).join(",\n")}\n}` : "";
  const dielInput = inputArray.length > 0
    ? `export enum DielInput {\n${inputArray.map(i => `${i.name} = "${i.name}"`).join(",\n")}\n}` : "";
  const dielView = viewArray.length > 0
  ? `export enum DielInput {\n${viewArray.map(i => `${i.name} = "${i.name}"`).join(",\n")}\n}` : "";

  return `
export const relations = {
  inputs: ${JSON.stringify(inputArray, null, 2)},
  outputs: ${JSON.stringify(outputArray, null, 2)},
  views: ${JSON.stringify(viewArray, null, 2)},
};
${dielOutput}
${dielInput}
${dielView}`;
}

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

function generateTypes(ins: RelationIr[]) {
  const objectDefs = ins.map(i => {
    const capFirstLetterName = i.name.charAt(0).toUpperCase() + i.name.slice(1);
    const fields = i.columns.map(c => `  ${c.name}: ${dataTypeToTypeScript(c.type)};`).join("\n");
    return `
export type ${capFirstLetterName}Input = {\n${fields}\n};`;
});
  return objectDefs.join("\n");
}

// scrap
// );`insert into ${i.name} (${i.columns.map(c => c.name).join(", ")}) values (${i.columns.map(v => `$${v.name}`).join(", ")});`
function createInputTs(ins: RelationIr[]) {
  return ins.map(r => ({
    name: r.name,
    query: `
    insert into ${r.name} (timestep, timestamp, ${r.columns.map(c => c.name).join(", ")})
    select max(timestep), timeNow(), ${r.columns.map(c => c.name).map(v => `$${v}`).join(", ")}
    from allInputs;`
  }));
}

function createOutputTs(outs: DerivedRelationIr[]) {
  return outs.map(r => ({
    name: r.name,
    query: `select * from ${r.name};`
  }));
}

function createViewsTs(views: DerivedRelationIr[]) {
  return views.filter(v => v.isPublic).map(r => ({
    name: r.name,
    query: `select * from ${r.name};`
  }));
}

export function genTs(ir: DielIr) {
  const inputArray = createInputTs(ir.inputs);
  const outputArray = createOutputTs(ir.outputs);
  const viewArray = createViewsTs(ir.views);
  const stmts = generateStmts(inputArray, outputArray, viewArray);
  const definitions = generateTypes(ir.inputs);
  return stmts + definitions;
}