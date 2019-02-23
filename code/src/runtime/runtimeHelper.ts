import { Database, QueryResults } from "sql.js";
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

export type WorkerMetaData = {
  queries: string,
  names: string[]
};

export function processSqliteMasterMetaData(r: QueryResults[]): WorkerMetaData {
  let queries = "";
  let names: string[] = [];
  if (r && r.length > 0) {
    names = r[0].values.map(row => row[1] as string);
    queries = r[0].values.map(row => {
      const queryWithReigster = (row[0] as string).replace(/create table/ig, "register table");
      // basically going to regex the create table to register table
      return `${queryWithReigster};\n`;
    }).join("");
  }
  return {
    queries,
    names
  };
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