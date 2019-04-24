import { ParsePlainDielAst, CompileAst } from "../../src/compiler/compiler";
import { DielDataType } from "../../src/parser/dielAstTypes";
import { getColumnTypeFromRelation } from "../../src/compiler/passes/inferType";
import { GenerateUnitTestErrorLogger } from "../testHelper";
import { GetRelationDef } from "../../src/compiler/DielAstGetters";

export function assertMultiplyType() {
  const q = `
  create event table t (a int);
  create view v2 as select a*2 as newA from t;
  `;
  const logger = GenerateUnitTestErrorLogger("assertMultiplyType", q);
  let ast = ParsePlainDielAst(q);
  CompileAst(ast);
  const v2 = GetRelationDef(ast, "v2");
  const v2Type = getColumnTypeFromRelation(v2, "newA");
  if (v2Type !== DielDataType.Number) {
    logger.error(`Column "newA" of "v2" is not correctly typed, got ${v2Type} instead`);
  }
  logger.pass();
  return true;
}

export function assertSimpleType() {

  let q = `
  create event table Attendance (
      arrival int,
      departure int,
      aid int
  );

  create event table Attendee (
      aid int primary key,
      area text
  );
  create view v1Prime as select a.arrival from Attendance a;
  create view v1 as select arrival from Attendance;
  `;
  const logger = GenerateUnitTestErrorLogger("assertSimpleType", q);
  let ast = ParsePlainDielAst(q);
  // then we need to compile it!

  function arrivalAssert(viewName: string) {
    const viewAst = GetRelationDef(ast, viewName);
    const arrivalType = getColumnTypeFromRelation(viewAst, "arrival");
    if (arrivalType !== DielDataType.Number) {
      logger.error(`Column "arrival" of ${viewName} is not correctly typed, got ${arrivalType} instead`);
    }
  }
  arrivalAssert("v1Prime");
  arrivalAssert("v1");
  logger.pass();
  return true;
}

