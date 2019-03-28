import { DataType, DielAst, Command, Column, CompositeSelectionUnit, InsertionClause, RelationSelection, JoinAst, SelectionUnit, ColumnSelection, OrderByAst, RelationReference, SetOperator, JoinType, AstType, Order, GroupByAst, DropClause, DeleteClause } from "../../parser/dielAstTypes";
import { RelationSpec, RelationQuery, SqlAst, createSqlAstFromDielAst } from "./createSqlIr";
import { ReportDielUserError, LogInternalError, DielInternalErrorType, LogInternalWarning, ReportUserRuntimeError } from "../../lib/messages";
import { ExprAst, ExprType, ExprValAst, ExprColumnAst, ExprRelationAst, ExprFunAst, FunctionType, BuiltInFunc, ExprParen } from "../../parser/exprAstTypes";

export function generateSqlFromDielAst(ast: DielAst, options?: { replace: boolean; isRemote: boolean}) {
  const isRemote = options ? options.isRemote ? options.isRemote : false : false;
  const sqlAst = createSqlAstFromDielAst(ast, isRemote);
  const replace = options ? options.replace ? options.replace : false : false;
  return generateStringFromSqlIr(sqlAst, replace);
}

export function generateStringFromSqlIr(sqlAst: SqlAst, replace = false): string[] {
  // if remoteType is server, then we need to drop the old ones if we want to make a new one
  // we need to architect this properly to scale, but a quick fix for now
  const tables = sqlAst.tables.map(t => generateTableSpec(t, replace));
  const views = sqlAst.views.map(v => generateSqlViews(v, replace));
  let triggers: string[] = [];
  sqlAst.triggers.forEach((v, k) => {
    triggers = triggers.concat(generateTrigger(v, k, replace));
  });
  let commands = sqlAst.commands.map(c => generateCommand(c));
  return tables.concat(views).concat(triggers).concat(commands);
}

function generateCommand(command: Command) {
  switch (command.astType) {
    case AstType.Delete:
      return generateDelete(command as DeleteClause);
    case AstType.Insert:
      return generateInserts(command as InsertionClause);
    case AstType.Drop:
      // allCmdStrs.push(generateDr(command as DropClause));
      LogInternalError(`Not implemented`, DielInternalErrorType.NotImplemented);
    break;
    case AstType.RelationSelection:
      return generateSelect((command as RelationSelection).compositeSelections);
  }
}

// FIXME note that we should probably not use the if not exist as a crutch
// to fix later
function generateTableSpec(t: RelationSpec, replace = false): string {
  const replaceQuery = replace ? `DROP TABLE IF EXISTS ${t.name};` : "";
  return `${replaceQuery}
  CREATE TABLE ${t.name} (
    ${t.columns.map(c => generateColumnDefinition(c)).join(",\n")}
  )`;
}

export function generateSqlViews(v: RelationQuery, replace = false): string {
  const replaceQuery = replace ? `DROP VIEW IF EXISTS ${v.name};` : "";
  return `${replaceQuery}
  CREATE VIEW ${v.name} AS
  ${generateSelect(v.query)}
  `;
}

export function generateSelect(v: CompositeSelectionUnit[]): string {
  return v.map(c => generateCompositeSelectionUnit(c)).join("\n");
}

const setOperatorToString = new Map([
  [SetOperator.NA, ""],
  [SetOperator.UNION, "UNION"],
  // [SetOperator.EXCEPT, "EXCEPT"],
  // [SetOperator.UNIONALL, "UNION ALL"],
  [SetOperator.INTERSECT, "INTERSECT"],
]);

export function generateCompositeSelectionUnit(c: CompositeSelectionUnit): string {
  const op = setOperatorToString.get(c.op);
  const query = generateSelectionUnit(c.relation);
  // the replace is a temporay patch to make the results look better
  return `${op} ${query}`.replace(/  \n[  \n]+/g, " ");
}

export function generateSelectionUnit(v: SelectionUnit): string {
  const selection = generateColumnSelection(v.columnSelections);
  // const selection = original
  //   ? generateColumnSelection(v.columnSelections)
    // : generateColumnSelection(v.derivedColumnSelections)
    // ;
  return `SELECT ${v.isDistinct ? "DISTINCT" : ""} ${selection}
    ${generateSelectionUnitBody(v)}
  `;
}

/** For view constraint composite selection */
export function generateViewConstraintSelection(v: SelectionUnit): string {
  let ret = `SELECT ${generateColumnSelection(v.columnSelections)}
  FROM
  (
    ${generateSelectionUnit(v.baseRelation.subquery.compositeSelections[0].relation)}
  )
  ${generateWhere(v.whereClause)}
  ${generateGroupBy(v.groupByClause)}`;
  return ret;
}


/**
 * this is exported so that the codeDiv can use it
 * need to be cleaner for the future
 * @param v
 */
export function generateSelectionUnitBody(v: SelectionUnit) {
  return `${v.baseRelation ? `FROM ${generateRelationReference(v.baseRelation)}` : ""}
  ${v.joinClauses ? v.joinClauses.map(j => generateJoin(j)).join("\n") : ""}
  ${generateWhere(v.whereClause)}
  ${generateGroupBy(v.groupByClause)}
  ${generateOrderBy(v.orderByClause)}
  ${generateLimit(v.limitClause)}`;
}

export function generateRelationReference(r: RelationReference): string {
  // here there will be no stars..
  let query = "";
  if (r.relationName) {
    query += r.relationName;
  } else {
    query += `(${generateSelect(r.subquery.compositeSelections)})`;
  }
  if (r.alias) {
    query += ` AS ${r.alias}`;
  }
  return query;
}

/**
 * Note that here we will assume there is no
 * @param s
 */
function generateColumnSelection(s: ColumnSelection[]): string {

  if (!s || s.length === 0) {
    return "";
  }
  return `${s.map(c => {
    const alias = c.alias ? ` AS ${c.alias}` : "";
    return generateExpr(c.expr) + alias;
  }).join(", ")}`;
}

const joinOpToString = new Map([
  [JoinType.LeftOuter, "LEFT OUTER JOIN"],
  [JoinType.Inner, "JOIN"],
  [JoinType.CROSS, "CROSS JOIN"],
]);

function generateJoin(j: JoinAst): string {
  if (!j) return "";
  const op = joinOpToString.get(j.joinType);
  const pred = j.predicate
    ? `ON ${generateExpr(j.predicate)}`
    : ""
    ;
  return `${op} ${generateRelationReference(j.relation)} ${pred}`;
}

function generateWhere(e: ExprAst): string {
  if (!e) return "";
  return `WHERE ${generateExpr(e)}`;
}

// recursive fun...
export function generateExpr(e: ExprAst): string {
  switch (e.exprType) {
    case ExprType.Val:
      const v = e as ExprValAst;
      const str = v.value.toString();
      if ((e.dataType === DataType.String) || (e.dataType === DataType.TimeStamp)) {
        return `'${str}'`;
      }
      return str;
    case ExprType.Column:
      const c = e as ExprColumnAst;
      const prefix = c.relationName ? `${c.relationName}.` : "";
      if (c.hasStar) {
        return `${prefix}*`;
      }
      return `${prefix}${c.columnName}`;
    case ExprType.Relation:
      const r = e as ExprRelationAst;
      return `(${generateSelect(r.selection.compositeSelections)})`;
    case ExprType.Parenthesis:
      const p = e as ExprParen;
      return `(${generateExpr(p.content)})`;
    case ExprType.Func:
      const f = e as ExprFunAst;
      // this is functions
      switch (f.functionType) {
        case FunctionType.Math:
        case FunctionType.Compare:
        case FunctionType.Logic:
          // assert that there are two args
          if (f.args.length !== 2) {
            ReportDielUserError(`Function ${f.functionReference} should have 2 arguemnts`);
          }
          return `${generateExpr(f.args[0])} ${f.functionReference} ${generateExpr(f.args[1])}`;
        case FunctionType.BuiltIn:
          switch (f.functionReference) {
            case BuiltInFunc.ConcatStrings:
              return f.args.map(a => generateExpr(a)).join(" || ");
            case BuiltInFunc.IfThisThen:
              const whenCond = generateExpr(f.args[0]);
              const thenExpr = generateExpr(f.args[1]);
              const elseExpr = generateExpr(f.args[2]);
              return `CASE WHEN ${whenCond} THEN ${thenExpr} ELSE ${elseExpr} END`;
            case BuiltInFunc.ValueIsNotNull:
            case BuiltInFunc.ValueIsNull:
              // should only have one
              if (f.args.length !== 1) {
                LogInternalError(`Is or Not Null filters should only have one argument`);
              }
              return `${generateExpr(f.args[0])} ${f.functionReference}`;
            default:
              // the rest should work with their references
              return `${f.functionReference} (${f.args.map(a => generateExpr(a)).join(", ")})`;
          }
        case FunctionType.Custom:
          return `${f.functionReference} (${f.args.map(a => generateExpr(a)).join(", ")})`;
        default:
          LogInternalError(`FunctionType type ${f.functionType} not handled`, DielInternalErrorType.UnionTypeNotAllHandled);
      }
    default:
      LogInternalError(`Expr type ${e.exprType} not handled`, DielInternalErrorType.UnionTypeNotAllHandled);
  }
}

function generateGroupBy(g: GroupByAst): string {
  if (!g) return "";
  const groups = g.selections.map(sI => generateExpr(sI)).join(", ");
  if (g.predicate) {
    return `GROUP BY ${groups} HAVING ${generateExpr(g.predicate)}`;
  } else {
    return `GROUP BY ${groups}`;
  }
}

function generateOrderBy(o: OrderByAst[]): string {
  if (!o) return "";
  const orders = o.map(i => `${generateExpr(i.selection)} ${generateOrder(i.order)}`);
  return `ORDER BY ${orders.join(", ")}`;
}

function generateOrder(order: Order): string {
  if (!order) return "";
  return order === Order.ASC
    ? "ASC"
    : "DESC";
}

function generateLimit(e: ExprAst): string {
  if (!e) return "";
  return `LIMIT ${generateExpr(e)}`;
}

function generateTrigger(queries: Command[], input: string, replace = false): string {
  if (!input) {
    // this is the general one
    LogInternalError(`trigger even must be specified`);
  }
  const triggerName = `${input}DielProgram`;
  const replaceQuery = replace ? `DROP TRIGGER IF EXISTS ${triggerName};` : "";
  let program = `${replaceQuery}
  CREATE TRIGGER ${triggerName} AFTER INSERT ON ${input}\nBEGIN\n`;
  program += queries.map(p => {
    if (p.astType === AstType.RelationSelection) {
      const r = p as RelationSelection;
      return generateSelect(r.compositeSelections) + ";";
    } else {
      const i = p as InsertionClause;
      return generateInserts(i) + ";";
    }
  }).join("\n");
  program += "\nEND;";
  return program;
}

export function generateInsertClauseStringForValue(raw: any): string {
  // it can be explicitly set to null, but not undefined
  if (raw === undefined) {
    LogInternalError(`Insertion should be defined.`);
  }
  // need to avoid the case when 0 is entered, which is valid!
  return (raw === null)
    ? "null"
    : (typeof raw === "string") ? `'${raw}'` : raw
    ;
}

function generateInserts(i: InsertionClause): string {
  if (!i) return "";
  const columns = i.columns && i.columns.length > 0
    ? `(${i.columns.map(c => c).join(", ")})`
    : "";
  let values;
  if (i.values) {
    values = `VALUES (${i.values.map(v => generateInsertClauseStringForValue(v)).join(", ")})`;
  } else if (i.selection) {
    values = generateSelect(i.selection.compositeSelections);
  }
  return `INSERT INTO ${i.relation} ${columns} ${values}`;
}

function generateDelete(d: DeleteClause): string {
  return "";
}

const TypeConversionLookUp = new Map<DataType, string>([
  [DataType.String, "TEXT"],
  [DataType.Number, "REAL"],
  [DataType.Boolean, "INTEGER"],
  [DataType.TimeStamp, "DATETIME"]
]);

function generateColumnDefinition(c: Column): string {
  const typeStr = TypeConversionLookUp.get(c.type);
  if (!typeStr) {
    LogInternalError(`data type ${c.type} is not mapped tos tring`);
  }
  const plainQuery = `${c.name} ${typeStr}`;
  if (!c.constraints) {
    // LogInternalError(`Constraints for column ${c.name} is not defined`);
    return plainQuery;
  }
  const notNull = c.constraints.notNull ? "NOT NULL" : "";
  const unique = c.constraints.unique ? "UNIQUE" : "";
  const primary = c.constraints.primaryKey ? "PRIMARY KEY" : "";
  const autoincrement = c.constraints.autoincrement ? "AUTOINCREMENT" : "";
  const defaultVal = c.defaultValue ? `DEFAULT ${generateExpr(c.defaultValue)}` : "";
  return `${plainQuery} ${notNull} ${unique} ${primary} ${autoincrement} ${defaultVal}`;
}