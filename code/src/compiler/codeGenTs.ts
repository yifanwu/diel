import { DielIr, RelationIr, DerivedRelationIr } from "../parser/dielTypes";
import { RelationTs } from "../dist/dielUtils";

// scrap
// import { RelationTs } from "diel";
// : RelationTs[]
function overallTemplate(inputArray: RelationTs[], outputArray: RelationTs[], viewArray: RelationTs[]) {
  return `
import { RelationTs } from "../dielUtils";
export const inputRelations: RelationTs[] = ${JSON.stringify(inputArray, null, 2)};
export const outputRelations: RelationTs[] = ${JSON.stringify(outputArray, null, 2)};
export const viewRelations: RelationTs[] = ${JSON.stringify(viewArray, null, 2)};
  `;
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

export function genTs(ir: DielIr) {
  const inputArray = createInputTs(ir.inputs);
  const outputArray = createOutputTs(ir.outputs);
  const viewArray = createOutputTs(ir.views);
  const file = overallTemplate(inputArray, outputArray, viewArray);
  return file;
}