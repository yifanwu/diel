// import { Database, QueryResults } from "sql.js";
import { RelationObject } from "./runtimeTypes";
import { RelationSelection, ExprAst, ExprType, ExprColumnAst } from "../parser/dielAstTypes";
import { LogInternalError } from "../util/messages";

type QueryResults = any;
type Database = any;

function getNameFromExpr(e: ExprAst): string | undefined {
  switch (e.exprType) {
    case ExprType.Column:
      return (e as ExprColumnAst).columnName;
    default:
      return "";
  }
}

export function GenerateViewName(q: RelationSelection) {
  const hash = Math.floor(Math.random() * 1000).toString();
  if (q.compositeSelections) {
    const hintRel = q.compositeSelections[0].relation.baseRelation
      ? "_" + q.compositeSelections[0].relation.baseRelation.alias
      : "";
    const hintCol = q.compositeSelections[0].relation.columnSelections
                  .map(c => c.alias ? c.alias : getNameFromExpr(c.expr))
                  .join("_");
    return `${hintCol}${hintRel}${hash}`;
  }
  return hash;
}

export function CaughtLocalRun(db: Database, s: string) {
  try {
    console.log(`%c Running Query in Main:\n${s}`, "color: purple");
    db.run(s);
  } catch (error) {
    LogInternalError(`Error while running\n${s}\n${error}`);
  }
}

/**
 * returns all the SQL that defines tables in this DB
 *   so that we can add to IR parsing (for type inference and other processing needs)
 */
export function getExistingTableDefinitions(isWorker: boolean, db: Database): string {
  let queries = "";
  const q = `SELECT name, sql FROM sqlite_master WHERE type='table'`;

  if (isWorker) {
    throw new Error(`not yet implemented`);
  } else {
    const done = () => { console.log("done"); }
    db.each(q, (o: any) => {
      queries += queries + o.sql;
    }, done);
  }
  return queries;
}

/**
 * Hack: some relations are defined already from another session---currently we don't have a hook to clean up, so skip them
 * , relationsToSkip?: string[]
 */
export function processSqlMetaDataFromRelationObject(rO: RelationObject, sourceName: string): string {
  // const filtered = (relationsToSkip)
  //   ? rO.filter(r => !relationsToSkip.find(rS => rS === r["name"]))
  //   : rO;
  return rO.map(definition => definition["sql"].toString()
    .replace(/create table/ig, `\n--${sourceName}\nregister table`) + ";")
    .join("\n");
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

export function convertDataToUpdateString(raw_values: QueryResults, relationName: string): string {
  const values = raw_values.map((d: any[]) => `(${d.map((v: any) => (v === null) ? "null" : `'${v}'`).join(", ")})`);
  let sql = `
    DELETE from ${relationName};
    INSERT INTO ${relationName} VALUES ${values};
  `;
  return sql;
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


export function convertRelationObjectToQueryResults(ro: RelationObject): QueryResults {
  let qr = {
    columns: [],
    values: []
  } as QueryResults;
  qr.columns = Object.keys(ro[0]);
  ro.forEach((array) => {
    let values: string[] = [];
    qr.columns.forEach((colname: any) => {
      values.push(array[colname] as string);
    });
    qr.values.push(values);
  });
  return qr;
}