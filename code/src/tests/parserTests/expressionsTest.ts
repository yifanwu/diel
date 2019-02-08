import { getDielIr } from "../../lib/cli-compiler";
import { GenerateUnitTestErrorLogger, LogInfo } from "../../lib/messages";
import { ExprColumnAst } from "../../parser/exprAstTypes";

export function assertGroupBy() {
  let q = `
  create input Attendance (
      arrival int,
      departure int,
      aid int
  );
  create view v1 as select avg(arrival), aid from Attendance group by aid;
  `;
  const logger = GenerateUnitTestErrorLogger("assertGroupBy", q);
  let ir = getDielIr(q);
  const v1Relation = ir.allDerivedRelations.get("v1");
  const groupByClauses = v1Relation[0].relation.groupByClause;
  if (groupByClauses.length !== 1) {
    logger(`View v1 does not have group by clause!`);
  }
  const groupByColumnName = (<ExprColumnAst>groupByClauses[0]).columnName;
  if (groupByColumnName !== "aid") {
    logger(`View v1 does not have the expected group by clause of aid, instead it got ${groupByColumnName}`);
  }
  LogInfo(`assertGroupBy passed`);
  return true;
}