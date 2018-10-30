import { DielIr, RelationIr, DerivedRelationIr } from "../parser/dielTypes";
import { RelationTs } from "../bin/dielUtils";

// scrap
// import { RelationTs } from "diel";
// : RelationTs[]
function overallTemplate(inputArray: RelationTs[], outputArray: RelationTs[], viewArray: RelationTs[]) {
  return `
export const relations = {
  inputs: ${JSON.stringify(inputArray, null, 2)},
  outputs: ${JSON.stringify(outputArray, null, 2)},
  views: ${JSON.stringify(viewArray, null, 2)},
};
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
  const file = overallTemplate(inputArray, outputArray, viewArray);
  return file;
}