import { DielAst, DynamicRelation, ProgramsIr, DataType } from "../../parser/dielAstTypes";
import { Column, CompositeSelectionUnit, InsertionClause, RelationSelection, JoinAst, SelectionUnit, ColumnSelection, OrderByAst, RelationReference, SetOperator, JoinType, AstType } from "../../parser/sqlAstTypes";
import { RelationSpec, RelationQuery, SqlIr } from "./createSqlIr";
import { LogInternalError, ReportDielUserError } from "../../lib/messages";
import { ExprAst, ExprType, ExprValAst, ExprColumnAst, ExprRelationAst, ExprFunAst, FunctionType, BuiltInFunc, ExprParen } from "../../parser/exprAstTypes";

export function generateSqlFromIr(ir: SqlIr) {
  const tables = ir.tables.map(t => generateTableSpec(t));
  const views = ir.views.map(v => generateSqlViews(v));
  const triggers = ir.triggers.map(t => generateTrigger(t));
  return tables.concat(views).concat(triggers);
}

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
  return `${op} ${query}`;
}

export function generateSelectionUnit(v: SelectionUnit): string {
  return `SELECT ${generateColumnSelection(v.columnSelections)}
    ${generateSelectionUnitBody(v)}
  `;
}

/**
 * this is exported so that the codeDiv can use it
 * need to be cleaner for the future
 * @param v
 */
export function generateSelectionUnitBody(v: SelectionUnit) {
  return `FROM ${v.baseRelation}
  ${v.joinClauses.map(j => generateJoin(j))}
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
    query += generateSelect(r.subquery.compositeSelections);
  }
  if (r.alias) {
    query += `AS ${r.alias}`;
  }
  return query;
}

/**
 * Note that here we will assume there is no
 * @param s
 */
function generateColumnSelection(s: ColumnSelection[]): string {
  return `${s.map(c => generateExpr(c.expr))}`;
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
  return `WHERE ${generateExpr(e)}`;
}

// recursive fun...
function generateExpr(e: ExprAst): string {
  if (e.exprType === ExprType.Val) {
    const v = e as ExprValAst;
    return v.value.toString();
  } else if (e.exprType === ExprType.Column) {
    const c = e as ExprColumnAst;
    // again the columns should have no stars anymore!
    return `${c.relationName ? `${c.relationName}.` : ""}${c.columnName}`;
  } else if (e.exprType === ExprType.Relation) {
    const r = e as ExprRelationAst;
    return generateSelect(r.selection.compositeSelections);
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
    } else if ((f.functionType === FunctionType.BuiltIn) && (f.functionReference === BuiltInFunc.ConcatStrings)) {
      return f.args.map(a => generateExpr(a)).join(" || ");
    } else {
      // custom
      return `${f.functionReference} (${f.args.map(a => generateExpr(a)).join(", ")})`;
    }
  } else {
    throw new Error("Expr type not handled");
  }
}

function generateGroupBy(s: ColumnSelection[]): string {
  return `GROUP BY ${generateColumnSelection(s)}`;
}

function generateOrderBy(o: OrderByAst[]): string {
  return `ORDER BY ${o.map(i => i.selection)}`;
}

function generateLimit(e: ExprAst): string {
  return `LIMIT ${generateExpr(e)}`;
}

function generateTrigger(t: ProgramsIr): string {
  if (!t.input) {
    // this is the general one
    return "";
  }
  let program = `CREATE TRIGGER ${t.input}DielProgram AFTER INSERT ON ${t.input}\nBEGIN\n`;
  program += t.queries.map(p => {
    if (p.astType === AstType.RelationSelection) {
      const r = p as RelationSelection;
      return generateSelect(r.compositeSelections);
    } else {
      const i = p as InsertionClause;
      return generateInserts(i);
    }
  }).join(";\n");
  program += "\nEND;";
  return program;
}

function generateInserts(i: InsertionClause): string {
  const values = i.values
    ? i.values.map(v => v.toString()).join(", ")
    : generateSelect(i.selection.compositeSelections);
  return `INSERT INTO ${i.relation} ${values}`;
}

const TypeConversionLookUp = new Map<DataType, string>([
  [DataType.String, "TEXT"], [DataType.Number, "REAL"], [DataType.Boolean, "INTEGER"]
]);

function generateColumnDefinition(c: Column): string {
  if (!c.constraints) {
    LogInternalError(`Constraints for column ${c.name} is not defined`);
  }
  const notNull = c.constraints.notNull ? "NOT NULL" : "";
  const unique = c.constraints.unique ? "UNIQUE" : "";
  const primary = c.constraints.key ? "PRIMARY KEY" : "";
  return `${c.name} ${TypeConversionLookUp.get(c.type)} ${notNull} ${unique} ${primary}`;
}