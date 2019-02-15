import { DielAst } from "./dielAstTypes";
import { ReportDielUserError } from "../lib/messages";

export function checkIsInput(name: string, ir: DielAst) {
  // we can be more intelligent, and see if it's a typo or they were listening on another table
  const r = ir.inputs.filter(i => i.name === name)[0];
  if (!r) {
    ReportDielUserError(`Diel expected ${name} to be an input, but we didn't find it, among the following inputs specified: ${ir.inputs.map(i => i.name).join(", ")}`);
  }
}

export function checkIsRelation(name: string, ir: DielAst) {
  // FIXME: think about making this more performant later
  const relations = [ir.inputs, ir.outputs, ir.originalRelations, ir.views].map((e: any) => e.name as string);
  const allTables = relations.reduce((acc: string[], r) => acc.concat(r), []);
  const r = allTables.filter(i => i === name)[0];
  // we want to mark it and then maybe evaluate it later?
  // we also want to find recursive dependencies...
  if (!r) {
    ReportDielUserError(`${name} is not defined.`);
  }
}