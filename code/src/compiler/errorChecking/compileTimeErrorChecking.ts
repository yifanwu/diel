import { DielAst } from "../../parser/dielAstTypes";
import { ReportDielUserError } from "../../lib/messages";

// this pass should inforce the following constraints:
// - there should only be one program that's generic
// - all the columns should match the columsn that exists in the actual tables
// - check that the generic program does not reference the relation new
// - also make sure that the number of inserts match the number of selects in a state program

export function sanityIr(ir: DielAst) {
  // TODO: no relation has no columns
  ir.originalRelations.map(r => {
    if (r.columns.length === 0) {
      ReportDielUserError(`Table ${r.name} contains no columns`);
    }
  });
  return true;
  // TODO: all referenced columns actually exists; do a typo check, also do a name check to see if it exists in other tables
  // TODO: make sure that there is only one general program
  // TODO: check that static tables are not inserted from any inputs
}

// also want to see if there are recursive relations --- i dont think recursive stuff is useful anyways.

// also need to check to make sure that the columns are properly *named*

// something about making subqueries run?

// const query = getCtxSourceCode(ctx);
//     if (!relation.name) {
//       ReportDielUserError(`You did not specify a alias for a nested relation for this part of the query`, query);
//     }

// need to check that the StaticTable are only over non-input tables.