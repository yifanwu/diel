import { DielIr } from "../DielIr";
import { dielIrComplain } from "../errorChecking/errorInfos";

/**
 * constraints can be created either on the column or on the table
 * we will move all to the table level for easier checking
 *   but i think SQL syntax requires some to be written in column leve, e.g., not null
 *   however primary key can be in both positions (presumably because it can take multiple columns)
 *
 * the function will walk through the original tables and move the column level
 *   constraints to relation constraints
 *   and maybe label the field  as "derived"
 *
 * see https://www.sqlite.org/syntax/column-constraint.html
 *     and https://www.sqlite.org/syntax/table-constraint.html
 *
 * we have augmented it so that it could work with views as well
 */
export function NormalizeConstraints(ir: DielIr) {
  ir.GetDielDefinedOriginalRelation().map((r) => {
    r.columns.map(c => {
      if (c.constraints) {
        if (c.constraints.notNull) {
          if (r.constraints.notNull) {
            r.constraints.notNull.push(c.name);
          } else {
            r.constraints.notNull = [c.name];
          }
        }
        if (c.constraints.unique) {
          if (r.constraints.uniques) {
            r.constraints.uniques.push([c.name]);
          } else {
            r.constraints.uniques = [[c.name]];
          }
        }
        if (c.constraints.primaryKey) {
          if (r.constraints.primaryKey) {
            dielIrComplain(`Cannot have more than one primary key! You already have ${r.constraints.primaryKey} but we are adding ${c.name}`);
          } else {
            r.constraints.primaryKey = [c.name];
          }
        }
      }
    });
  });
}
