import { getIR } from "../../compiler/compiler";
import { GenerateUnitTestErrorLogger, LogInfo } from "../../lib/messages";
import { DataType, Column, DielIr } from "../../parser/dielTypes";

/**
 * _checkView is a helper method
 * @param ir ir
 * @param view view
 * @param column column spec
 * @param logger logging function
 */
function _checkView(ir: DielIr, view: string, column: Column, logger: (m: string) => void) {
  const v = ir.views.filter(vItr => vItr.name === view)[0];
  if (!v) {
    logger(`Cannt find the definition for view ${view}`);
  }
  const c = v.columns.filter(v => v.name === column.name)[0];
  if (!c) {
    logger(`column ${column.name} of view ${view} was not found`);
  }
  if (!(c.type === column.type)) {
    logger(`column ${column.name} was not treated as an ${column.type} but rather ${c.type}`);
  }
}

function assertBasic() {
  const logger = GenerateUnitTestErrorLogger("assertBasic");
  const q = `
    create table t (a int);
    create view v1 as select a from t;
    create view v2 as select a*2 as newA from t;
    `;
  let ir = getIR(q);
  _checkView(ir, "v1", {name: "a", type: DataType.Number}, logger);
  _checkView(ir, "v2", {name: "newA", type: DataType.Number}, logger);
  LogInfo(`assertBasic passed`);
  return true;
}

function assertDerivedFromNested() {
  const logger = GenerateUnitTestErrorLogger("assertDerivedFromNested");
  const q = `
  create table t (a int, b string);
  register udf type int;
  register udf2 type boolean;
  create view v as
    select b, a*2 as newA
    from (select a, b from t where a > 5);
  create view v2 as
    select udf(b) as udfB, udf2(a) as udfA
    from t;`;
  console.log(`Testing ${q}`);
  let ir = getIR(q);
  _checkView(ir, "v", {name: "b", type: DataType.String}, logger);
  _checkView(ir, "v", {name: "newA", type: DataType.Number}, logger);
  _checkView(ir, "v2", {name: "udfB", type: DataType.Number}, logger);
  _checkView(ir, "v2", {name: "udfA", type: DataType.Boolean}, logger);
  LogInfo(`assertDerivedFromNested passed`);
  return true;
}

export function assertTypes() {
  assertBasic();
  assertDerivedFromNested();
}

assertTypes();