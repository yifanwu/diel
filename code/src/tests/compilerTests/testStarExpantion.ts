import { getDielIr } from "../../compiler/compiler";
import { GenerateUnitTestErrorLogger, LogInfo } from "../../lib/messages";
import { ExprColumnAst } from "../../parser/exprAstTypes";

export function assertAllStar() {
  const q = `
  create input t (a int, b int);
  create view v1 as select * from t;
  create view v2 as select a from t;
  `;
  const logger = GenerateUnitTestErrorLogger("assertAllStar", q);
  let ir = getDielIr(q);
  const v1 = ir.allDerivedRelations.get("v1");
  const v1Columns = v1[0].relation.derivedColumnSelections;
  if (!v1Columns) {
    logger(`v1 is not expanded`);
  }
  const firstCol = v1Columns[0].expr as ExprColumnAst;
  if (firstCol.columnName !== "a") {
    logger(`v1 did not expand properly, expected "a" but got ${firstCol.columnName} instead.`);
  }
  LogInfo(`assertAllStar passed`);
  return true;
}
