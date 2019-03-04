import { getDielIr } from "../../lib/cli-compiler";
import { GenerateUnitTestErrorLogger, LogInfo } from "../../lib/messages";
import { DataType } from "../../parser/dielAstTypes";

export function assertMultiplyType() {
  const q = `
  create event table t (a int);
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
  let ir = getDielIr(q);
  function arrivalAssert(viewName: string) {
    const arrivalType = ir.GetRelationColumnType(viewName, "arrival");
    if (arrivalType !== DataType.Number) {
      logger(`Column "arrival" of ${viewName} is not correctly typed, got ${arrivalType} instead`);
    }
  }
  arrivalAssert("v1Prime");
  arrivalAssert("v1");
  LogInfo(`assertSimpleType passed`);
  return true;
}

