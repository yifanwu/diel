import { getDielIr } from "../../compiler/compiler";
import { GenerateUnitTestErrorLogger, LogInfo } from "../../lib/messages";
import { DataType, DielAst } from "../../parser/dielAstTypes";
import { Column } from "../../parser/sqlAstTypes";

export function assertMultiplyType() {
  const q = `
  create input t (a int);
  create view v1 as select a from t;
  create view v2 as select a*2 as newA from t;
  `;
  const logger = GenerateUnitTestErrorLogger("assertMultiplyType", q);
  let ir = getDielIr(q);
  if (ir.GetRelationColumnType("v1", "a") !== DataType.Number) {
    logger(`Column "a" of "v1" is not correctly typed`);
  }
  if (ir.GetRelationColumnType("v2", "newA") !== DataType.Number) {
    logger(`Column "newA" of "v2" is not correctly typed`);
  }
  LogInfo(`assertMultiplyType passed`);
  return true;
}