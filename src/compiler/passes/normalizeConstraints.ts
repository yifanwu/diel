import { LogInternalError } from "../../util/messages";
import { OriginalRelation, DielAst } from "../../parser/dielAstTypes";
import { GetAllDielDefinedOriginalRelations } from "../DielAstGetters";

export function NormalizeConstraintsForSingleOriginalRelation(r: OriginalRelation) {
  r.columns.map(c => {
    if (c.constraints) {
      if (c.constraints.notNull) {
        if (r.constraints.notNull) {
          r.constraints.notNull.push(c.cName);
        } else {
          r.constraints.notNull = [c.cName];
        }
      }
      if (c.constraints.unique) {
        if (r.constraints.uniques) {
          r.constraints.uniques.push([c.cName]);
        } else {
          r.constraints.uniques = [[c.cName]];
        }
      }
      if (c.constraints.primaryKey) {
        if (r.constraints.primaryKey && (r.constraints.primaryKey.length > 0)) {
          LogInternalError(`Cannot have more than one primary key! You already have ${r.constraints.primaryKey} but we are adding ${c.cName}`);
        } else {
          r.constraints.primaryKey = [c.cName];
        }
      }
      // not including autoincrement here since it's not really a constraint... sigh semantics
    }
  });
}

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
export function NormalizeConstraints(ast: DielAst) {
  GetAllDielDefinedOriginalRelations(ast).map((r) => {
    NormalizeConstraintsForSingleOriginalRelation(r);
  });
}
