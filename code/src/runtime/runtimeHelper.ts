import { Database } from "sql.js";
import { DielAst } from "../parser/dielAstTypes";
import { DependencyTree } from "../compiler/passes/passesHelper";

/**
 * returns all the SQL that defines tables in this DB
 *   so that we can add to IR parsing (for type inference and other processing needs)
 */
export function getExistingTableDefinitions(isWorker: boolean, db?: Database, worker?: Worker): string {
  let queries = "";
  const q = `SELECT name, sql FROM sqlite_master WHERE type='table'`;

  if (isWorker) {
    throw new Error(`not yet implemented`);
  } else {
    db.each(q, (o: any) => {
      queries += queries + o.sql;
    }, null);
  }
  return queries;
}


// /**
//  * run time type checker
//  * @param fn
//  */
// export const checkType = fn => (params = []) => {
//   const { required } = fn;
//   const missing = required.filter(param => !(param in params));

//   if (missing.length) {
//     throw new Error(`${ fn.name }() Missing required parameter(s):
//     ${ missing.join(", ") }`);
//   }

//   return fn(params);
// };