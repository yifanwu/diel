import { DielIr } from "../parser/dielTypes";
import { columnStr } from "./helper";

// then there will another pass where we do the networking logic.
// export function setupNetworking(ir: DielIr) {
// }

export function genSql(ir: DielIr) {
  const inputQueries = ir.inputs.map(r => `
    create table ${r.name} (
      ${r.columns.map(c => columnStr(c)).join(",")}
    );
    `);
  const outputQueries = ir.outputs.map(r => `
    create view ${r.name} as ${r.query};
  `);
  return inputQueries.concat(outputQueries);
}
