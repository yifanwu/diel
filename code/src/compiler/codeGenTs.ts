import { DielIr, InputIr, OutputIr } from "../parser/dielTypes";

interface relationTs {
  name: string,
  query: string
}

function overallTemplate(inputArray: relationTs[], outputArray: relationTs[]) {
  return `
export const inputRelations = ${JSON.stringify(inputArray, null, 2)};
export const outputRelations = ${JSON.stringify(outputArray, null, 2)};
  `;
}

function createInputTs(ins: InputIr[]) {
  return ins.map(i => ({
    name: i.name,
    query: `insert into ${i.name} (${i.columns.map(c => c.name).join(", ")})
            values (${i.columns.map(v => `$${v.name}`).join(", ")});`
  }));
}

function createOutputTs(outs: OutputIr[]) {
  return outs.map(r => ({
    name: r.name,
    query: `select * from ${r.name};`
  }));
}

export function genTs(ir: DielIr) {
  const inputArray = createInputTs(ir.inputs);
  const outputArray = createOutputTs(ir.outputs);
  const file = overallTemplate(inputArray, outputArray);
  return file;
}