import { Database, QueryResults } from "sql.js";
import { DerivedRelation } from "../parser/dielAstTypes";
import { RelationObject } from "./runtimeTypes";

export function GetFirstSelectionUnitFromDerivedRelation(dR: DerivedRelation) {

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

// export type WorkerMetaData = {
//   queries: string,
//   names: string[]
// };

// export function processSqliteMasterMetaData(r: QueryResults[]): WorkerMetaData {
//   let queries = "";
//   let names: string[] = [];
//   if (r && r.length > 0) {
//     names = r[0].values.map(row => row[1] as string);
//     queries = r[0].values.map(row => {
//       const queryWithReigster = (row[0] as string).replace(/create table/ig, "register table");
//       // basically going to regex the create table to register table
//       return `${queryWithReigster};\n`;
//     }).join("");
//   }
//   return {
//     queries,
//     names
//   };
// }

export function processSqlMetaDataFromRelationObject(rO: RelationObject): string {
  return rO.map(definition => definition["sql"].toString().replace(/create table/ig, "register table") + ";").join("\n");
}

export function parseSqlJsWorkerResult(data: QueryResults[]): RelationObject {
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