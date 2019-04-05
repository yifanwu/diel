import { Database, QueryResults } from "sql.js";
import { RelationObject } from "./runtimeTypes";
import { SelectionUnit } from "../parser/dielAstTypes";

export function generateViewNameForSelect(ast: SelectionUnit) {

}

/**
 * returns all the SQL that defines tables in this DB
 *   so that we can add to IR parsing (for type inference and other processing needs)
 */
export function getExistingTableDefinitions(isWorker: boolean, db?: Database): string {
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

export function processSqlMetaDataFromRelationObject(rO: RelationObject, sourceName: string): string {
  return rO.map(definition => definition["sql"].toString().replace(/create table/ig, `\n--${sourceName}\nregister table`) + ";").join("\n");
}

export function ParseSqlJsWorkerResult(data: QueryResults[]): RelationObject {
  if (data && (data.length > 0) && data[0].values) {
    const o: RelationObject = data[0].values.map((v: any[]) => {
      let oi: any = {};
      v.map((vi, i) => {
        oi[data[0].columns[i]] = vi;
      });
      return oi;
    });
    return o;
  }
  return [];
}

/**
 * emulates better-sqlite's prepare('query').all()
 * @param db Database instance
 * @param query must be single line with no parameters
 */
export function SqlJsGetObjectArrayFromQuery(db: Database, query: string) {
  const stmt = db.prepare(query);
  stmt.bind({});
  let r = [];
  while (stmt.step()) {
    r.push(stmt.getAsObject());
  }
  return r;
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