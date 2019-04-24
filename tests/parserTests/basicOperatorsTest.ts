import { ParsePlainDielAst } from "../../src/compiler/compiler";
import { assertExprAsFunctionWithName, assertExprAsColumnWithname, assertValue, GenerateUnitTestErrorLogger } from "../testHelper";
import { ExprColumnAst, ExprFunAst, DerivedRelation } from "../../src/parser/dielAstTypes";
import { GetRelationDef } from "../../src/compiler/DielAstGetters";

export function assertBasicOperators() {
  const q = `
  create event table Attendance (
      arrival int,
      departure int,
      aid int
  );
  create view v1 as select avg(arrival), aid from Attendance group by aid having avg(arrival) > 8 order by aid asc limit 5;
  `;
  const logger = GenerateUnitTestErrorLogger("assertBasicOperators", q);
  const ast = ParsePlainDielAst(q);
  const v1Relation = (GetRelationDef(ast, "v1") as DerivedRelation).selection.compositeSelections[0].relation;
  // test group by
  const groupByClauses = v1Relation.groupByClause;
  if (groupByClauses.selections.length !== 1) {
    logger.error(`View v1 does not have group by clause!`);
  }
  const groupByColumnName = (<ExprColumnAst>groupByClauses.selections[0]).columnName;
  if (groupByColumnName !== "aid") {
    logger.error(`View v1 does not have the expected group by clause of aid, instead it got ${groupByColumnName}`);
  }
  // test having
  if (!assertExprAsFunctionWithName(groupByClauses.predicate, ">")) {
    logger.error(`View v1's having clause didn't recognize the function expression, got ${JSON.stringify(groupByClauses.predicate)} instead`);
  }
  const avgExpr = (<ExprFunAst>groupByClauses.predicate).args[0];
  if (!assertExprAsFunctionWithName(avgExpr, "avg")) {
    logger.error(`View v1's having clause didn't recognize the column argument, got ${JSON.stringify(avgExpr)} instead`);
  }
  // test order by
  const orderByClauses = v1Relation.orderByClause;
  if (!assertExprAsColumnWithname(orderByClauses[0].selection, "aid")) {
    logger.error(`View v1's having clause didn't recognize the column argument, got ${JSON.stringify(orderByClauses[0].selection)} instead`);
  }
  // test limit by
  const limitClause = v1Relation.limitClause;
  if (!assertValue(limitClause, 5)) {
    logger.error(`View v1's limit clause didn't get 5 properly, got ${JSON.stringify(limitClause)} instead`);
  }
  logger.pass();
  return true;
}

