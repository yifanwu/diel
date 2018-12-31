import { getDielIr } from "../../compiler/compiler";
import { GenerateUnitTestErrorLogger, LogInfo } from "../../lib/messages";
import { DataType } from "../../parser/dielAstTypes";

export function assertMultiplyType() {
  const q = `
  create input t (a int);
  create view v2 as select a*2 as newA from t;
  `;
  const logger = GenerateUnitTestErrorLogger("assertMultiplyType", q);
  let ir = getDielIr(q);
  const v2Type = ir.GetRelationColumnType("v2", "newA");
  if (v2Type !== DataType.Number) {
    logger(`Column "newA" of "v2" is not correctly typed, got ${v2Type} instead`);
  }
  LogInfo(`assertMultiplyType passed`);
  return true;
}