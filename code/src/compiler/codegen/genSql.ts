import { DielAst, DynamicRelation, ProgramsIr, DataType } from "../../parser/dielAstTypes";
import { Column, CompositeSelectionUnit, InsertionClause, RelationSelection, JoinAst, SelectionUnit, ColumnSelection, OrderByAst, RelationReference, SetOperator, JoinType } from "../../parser/sqlAstTypes";
import { RelationSpec, RelationQuery, SqlIr } from "../passes/createSqlIr";
import { LogInternalError, ReportDielUserError } from "../../lib/messages";
import { ExprAst, ExprType, ExprValAst, ExprColumnAst, ExprRelationAst, ExprFunAst, FunctionType, BuiltInFunc, ExprParen } from "../../parser/exprAstTypes";
// taking in the interface in SqlIr

export function generateSqlFromIr(ir: SqlIr) {
  const tables = ir.tables.map(t => generateTableSpec(t));
  const views = ir.views.map(v => generateViews(v));
  return tables.concat(views);
}

function generateTableSpec(t: RelationSpec): string {
  return `create table ${t.name} (
    ${t.columns.map(c => generateColumnDefinition(c)).join(",\n")}
  )`;
}

function generateViews(v: RelationQuery): string {
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

function generateSelectionUnit(v: SelectionUnit): string {
  return `select ${generateColumnSelection(v.selections)}
    from ${v.baseRelation}
    ${v.joinClauses.map(j => generateJoin(j))}
    ${generateWhere(v.whereClause)}
    ${generateGroupBy(v.groupByClause)}
    ${generateOrderBy(v.orderByClause)}
    ${generateLimit(v.limitClause)}
  `;
}

function generateRelationReference(r: RelationReference): string {
  // here there will be no stars..
  let query = "";
  if (r.relationName) {
    query += r.relationName;
  } else {
    query += generateSelect(r.subquery.selections);
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
  return `${s.map(c => c.relationName)}`;
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
    return `${c.column.relationName ? `${c.column.relationName}.` : ""}${c.column.columnName}`;
  } else if (e.exprType === ExprType.Relation) {
    const r = e as ExprRelationAst;
    return generateSelect(r.selection.selections);
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

}

function generateOrderBy(o: OrderByAst[]): string {

}

function generateLimit(e: ExprAst): string {
  return `LIMIT ${generateExpr(e)}`;
}

function generateTrigger(t: ProgramsIr): string {

}

function generateInserts(i: InsertionClause): string {

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