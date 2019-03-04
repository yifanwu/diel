import { getDielIr } from "../../lib/cli-compiler";
import { GenerateUnitTestErrorLogger, LogInfo } from "../../lib/messages";
import { ExprColumnAst } from "../../parser/exprAstTypes";
import { DataType } from "../../parser/dielAstTypes";

export function assertAllStar() {
  function assertColumns(viewName: string, selections: {columnName: string, relationName: string, dataType: DataType}[]) {
    const view = ir.allCompositeSelections.get(viewName);
    const columns = view[0].relation.derivedColumnSelections;
    if (!columns) {
      logger(`${viewName} is not expanded`);
    }
    selections.forEach((v, idx) => {
      const col = columns[idx].expr as ExprColumnAst;
      if (col.columnName !== v.columnName) {
        logger(`${viewName} did not expand properly, expected column name "${v.columnName}" but got ${col.columnName} instead.`);
      }
      if (col.relationName !== v.relationName) {
        logger(`${viewName} did not expand properly, expected normalized relation "${v.relationName}" but got ${col.relationName} instead.`);
      }
      if (col.dataType !== v.dataType) {
        logger(`${viewName} did not expand properly, expected type "${v.dataType}" but got ${col.dataType} instead.`);
      }
    });
  }
  const q = `
  create event table t (a int, b int);
  create event table t2 (a int, c int);
  create view v1 as select * from t;
  create view v2 as select t2.* from t join t2 on t.a = t2.a;
  `;
  const logger = GenerateUnitTestErrorLogger("assertAllStar", q);
  let ir = getDielIr(q);
  assertColumns("v1", [
    {columnName: "a", relationName: "t", dataType: DataType.Number},
    {columnName: "b", relationName: "t", dataType: DataType.Number}
  ]);
  assertColumns("v2", [
    {columnName: "a", relationName: "t2", dataType: DataType.Number},
    {columnName: "c", relationName: "t2", dataType: DataType.Number}
  ]);
  LogInfo(`assertAllStar passed`);
  return true;
}
