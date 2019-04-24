import { LogInfo } from "../../src/util/messages";
import { ExprColumnAst, DielDataType, DerivedRelation, DielAst } from "../../src/parser/dielAstTypes";
import { GenerateUnitTestErrorLogger } from "../testHelper";
import { ParsePlainDielAst, CompileAst } from "../../src/compiler/compiler";
import { GetRelationDef } from "../../src/compiler/DielAstGetters";

export function assertAllStar() {
  function assertColumns(viewName: string, selections: {columnName: string, relationName: string, dataType: DielDataType}[]) {
    const view = GetRelationDef(ast, viewName) as DerivedRelation;
    const columns = view.selection.compositeSelections[0].relation.derivedColumnSelections;
    if (!columns) {
      logger.error(`${viewName} is not expanded`);
    }
    selections.forEach((v, idx) => {
      const col = columns[idx].expr as ExprColumnAst;
      if (col.columnName !== v.columnName) {
        logger.error(`${viewName} did not expand properly, expected column name "${v.columnName}" but got ${col.columnName} instead.`);
      }
      if (col.relationName !== v.relationName) {
        logger.error(`${viewName} did not expand properly, expected normalized relation "${v.relationName}" but got ${col.relationName} instead.`);
      }
      if (col.dataType !== v.dataType) {
        logger.error(`${viewName} did not expand properly, expected type "${v.dataType}" but got ${col.dataType} instead.`);
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
  let ast = ParsePlainDielAst(q);
  CompileAst(ast);
  assertColumns("v1", [
    {columnName: "a", relationName: "t", dataType: DielDataType.Number},
    {columnName: "b", relationName: "t", dataType: DielDataType.Number}
  ]);
  assertColumns("v2", [
    {columnName: "a", relationName: "t2", dataType: DielDataType.Number},
    {columnName: "c", relationName: "t2", dataType: DielDataType.Number}
  ]);
  logger.pass();
  return true;
}
