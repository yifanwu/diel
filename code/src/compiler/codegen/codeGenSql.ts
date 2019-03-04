import { DataType, DielAst, ProgramSpec } from "../../parser/dielAstTypes";
import { Column, CompositeSelectionUnit, InsertionClause, RelationSelection, JoinAst, SelectionUnit, ColumnSelection, OrderByAst, RelationReference, SetOperator, JoinType, AstType, Order, GroupByAst } from "../../parser/sqlAstTypes";
import { RelationSpec, RelationQuery, SqlIr, createSqlAstFromDielAst } from "./createSqlIr";
import { ReportDielUserError, LogInternalError } from "../../lib/messages";
import { ExprAst, ExprType, ExprValAst, ExprColumnAst, ExprRelationAst, ExprFunAst, FunctionType, BuiltInFunc, ExprParen } from "../../parser/exprAstTypes";

export function generateSqlFromDielAst(ast: DielAst) {
  const sqlAst = createSqlAstFromDielAst(ast);
  return generateStringFromSqlIr(sqlAst);
}

export function generateStringFromSqlIr(ir: SqlIr) {
  const tables = ir.tables.map(t => generateTableSpec(t));
  const views = ir.views.map(v => generateSqlViews(v));
  let triggers: string[] = [];
  ir.triggers.forEach((v, k) => {
    triggers = triggers.concat(generateTrigger(v, k));
  });
  return tables.concat(views).concat(triggers);
}

// FIXME note that we should probably not use the if not exist as a crutch
// to fix later
function generateTableSpec(t: RelationSpec): string {
  return `create table ${t.name} (
    ${t.columns.map(c => generateColumnDefinition(c)).join(",\n")}
  )`;
}

export function generateSqlViews(v: RelationQuery): string {
  return `create view ${v.name} as
  ${generateSelect(v.query)}
  `;
}

function generateSelect(v: CompositeSelectionUnit[]): string {
  return v.map(c => generateCompositeSelectionUnit(c)).join("\n");
}

const setOperatorToString = new Map([
  [SetOperator.NA, ""],
  [SetOperator.UNION, "UNION"],
  [SetOperator.EXCEPT, "EXCEPT"],
  [SetOperator.UNIONALL, "UNION ALL"],
  [SetOperator.INTERSECT, "INTERSECT"],
]);

function generateCompositeSelectionUnit(c: CompositeSelectionUnit): string {
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
  return `SELECT ${selection}
    ${generateSelectionUnitBody(v)}
  `;
}

/**
 * this is exported so that the codeDiv can use it
 * need to be cleaner for the future
 * @param v
 */
export function generateSelectionUnitBody(v: SelectionUnit) {
  return `${v.baseRelation ? `FROM ${generateRelationReference(v.baseRelation)}` : ""}
  ${v.joinClauses ? v.joinClauses.map(j => generateJoin(j)) : ""}
  ${generateWhere(v.whereClause)}
  ${generateGroupBy(v.groupByClause)}
  ${generateOrderBy(v.orderByClause)}
  ${generateLimit(v.limitClause)}`;
}

function generateRelationReference(r: RelationReference): string {
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
function generateExpr(e: ExprAst): string {
  if (e.exprType === ExprType.Val) {
    const v = e as ExprValAst;
    const str = v.value.toString();
    if ((e.dataType === DataType.String) || (e.dataType === DataType.TimeStamp)) {
      return `'${str}'`;
    }
    return str;
  } else if (e.exprType === ExprType.Column) {
    const c = e as ExprColumnAst;
    const prefix = c.relationName ? `${c.relationName}.` : "";
    if (c.hasStar) {
      return `${prefix}*`;
    }
    return `${prefix}${c.columnName}`;
  } else if (e.exprType === ExprType.Relation) {
    const r = e as ExprRelationAst;
    return `(${generateSelect(r.selection.compositeSelections)})`;
  } else if (e.exprType === ExprType.Parenthesis) {
    const p = e as ExprParen;
    return `(${generateExpr(p.content)})`;
  } else if (e.exprType === ExprType.Func) {
    const f = e as ExprFunAst;
    // this is functions
    if (f.functionType === FunctionType.Math || f.functionType === FunctionType.Compare || f.functionType === FunctionType.Logic) {
      // assert that there are two args
      if (f.args.length !== 2) {
        ReportDielUserError(`Function ${f.functionReference} should have 2 arguemnts`);
      }
      return `${generateExpr(f.args[0])} ${f.functionReference} ${generateExpr(f.args[1])}`;
    } else if (f.functionType === FunctionType.BuiltIn) {
      if (f.functionReference === BuiltInFunc.ConcatStrings) {
        return f.args.map(a => generateExpr(a)).join(" || ");
      } else if (f.functionReference === BuiltInFunc.IfThisThen) {
        const whenCond = generateExpr(f.args[0]);
        const thenExpr = generateExpr(f.args[1]);
        const elseExpr = generateExpr(f.args[2]);
        return `CASE WHEN ${whenCond} THEN ${thenExpr} ELSE ${elseExpr} END`;
      }
      // the rest should work with their references
      return `${f.functionReference} (${f.args.map(a => generateExpr(a)).join(", ")})`;
    } else {
      // custom
      return `${f.functionReference} (${f.args.map(a => generateExpr(a)).join(", ")})`;
    }
  } else {
    throw new Error("Expr type not handled");
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

function generateTrigger(queries: ProgramSpec[], input: string): string {
  if (!input) {
    // this is the general one
    return "";
  }
  let program = `CREATE TRIGGER ${input}DielProgram AFTER INSERT ON ${input}\nBEGIN\n`;
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

function generateInserts(i: InsertionClause): string {
  if (!i) return "";
  const columns = `(${i.columns.map(c => c).join(", ")})`;
  const values = i.values
    ? `VALUES (${i.values.map(v => v.toString()).join(", ")})`
    : generateSelect(i.selection.compositeSelections);
  return `INSERT INTO ${i.relation} ${columns} ${values}`;
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
  const defaultVal = c.defaultValue ? `DEFAULT ${generateExpr(c.defaultValue)}` : "";
  return `${plainQuery} ${notNull} ${unique} ${primary} ${defaultVal}`;
}