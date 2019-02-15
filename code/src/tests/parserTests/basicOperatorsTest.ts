import { getDielIr } from "../../lib/cli-compiler";
import { GenerateUnitTestErrorLogger, LogInfo } from "../../lib/messages";
import { ExprColumnAst, ExprFunAst } from "../../parser/exprAstTypes";
import { assertExprAsFunctionWithName, assertExprAsColumnWithname, assertValue } from "../testHelper";

export function assertBasicOperators() {
  let q = `
  create input Attendance (
      arrival int,
      departure int,
      aid int
  );
  create view v1 as select avg(arrival), aid from Attendance group by aid having avg(arrival) > 8 order by aid asc limit 5;
  `;
  const logger = GenerateUnitTestErrorLogger("assertBasicOperators", q);
  let ir = getDielIr(q);
  const v1Relation = ir.allDerivedRelations.get("v1")[0].relation;
  // test group by
  const groupByClauses = v1Relation.groupByClause;
  if (groupByClauses.selections.length !== 1) {
    logger(`View v1 does not have group by clause!`);
  }
  const groupByColumnName = (<ExprColumnAst>groupByClauses.selections[0]).columnName;
  if (groupByColumnName !== "aid") {
    logger(`View v1 does not have the expected group by clause of aid, instead it got ${groupByColumnName}`);
  }
  // test having
  if (!assertExprAsFunctionWithName(groupByClauses.predicate, ">")) {
    logger(`View v1's having clause didn't recognize the function expression, got ${JSON.stringify(groupByClauses.predicate)} instead`);
  }
  const avgExpr = (<ExprFunAst>groupByClauses.predicate).args[0];
  if (!assertExprAsFunctionWithName(avgExpr, "avg")) {
    logger(`View v1's having clause didn't recognize the column argument, got ${JSON.stringify(avgExpr)} instead`);
  }
  // test order by
  const orderByClauses = v1Relation.orderByClause;
  if (!assertExprAsColumnWithname(orderByClauses[0].selection, "aid")) {
    logger(`View v1's having clause didn't recognize the column argument, got ${JSON.stringify(orderByClauses[0].selection)} instead`);
  }
  // test limit by
  const limitClause = v1Relation.limitClause;
  if (!assertValue(limitClause, 5)) {
    logger(`View v1's limit clause didn't get 5 properly, got ${JSON.stringify(limitClause)} instead`);
  }
  LogInfo(`assertBasicOperators passed`);
  return true;
}

