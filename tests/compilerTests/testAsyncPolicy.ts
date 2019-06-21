import { DbType } from "../../src";
import { DielPhysicalExecution } from "../../src/compiler/DielPhysicalExecution";
import { CompileAst, ParsePlainDielAst } from "../../src/compiler/compiler";
import { LogicalTimestep, RelationType, Relation } from "../../src/parser/dielAstTypes";
import { GetAsyncViewNameFromOutput } from "../../src/runtime/asyncPolicies";
import { GenerateUnitTestErrorLogger } from "../testHelper";

// the logic here is primarily in DielPhysicalExecution
// mock up a dielphsyical execution class

export function testAsyncPolicy() {
  const query = `
  REGISTER table flights (origin text, delay integer);
  create output o1 as
  select distinct origin from flights where delay > 500;
  `;
  const logger = GenerateUnitTestErrorLogger("testAsyncPolicy", query);
  const ast = ParsePlainDielAst(query);
  CompileAst(ast);
  const physicalMetaData = {
    dbs: new Map([[1, {dbType: DbType.Local}], [2, {dbType: DbType.Worker}]]),
    relationLocation: new Map([["flights", {dbId: 2}]])
  };
  // dummy!
  const getEventByTimestep = (n: LogicalTimestep) => "";
  const addRelationToDielMock = (r: Relation) => {};
  const physicalExecution = new DielPhysicalExecution(ast, physicalMetaData, getEventByTimestep, addRelationToDielMock);
  // now assert!
  const local = physicalExecution.sqlAstSpecPerDb.get(1);
  // local must have o1 as select from an event
  const remote = physicalExecution.sqlAstSpecPerDb.get(2);
  if (!remote) return logger.error(`Remote was not defined`);
  const asyncViewName = GetAsyncViewNameFromOutput("o1");
  const asyncView = remote.relations.find(r => r.rName === asyncViewName);
  if (!asyncView) {
    logger.error(`remote async view was not generated`);
  }
  const shippedAsyncView = local.relations.find(r => r.rName === asyncViewName);
  if (!shippedAsyncView) {
    logger.error(`local async view event was not generated`);
    if (!shippedAsyncView.isDynamic) {
      logger.error(`local async view event should be marked as dynamic`);
    }
  }
  const outputView = local.relations.find(r => r.rName === "o1");
  if (!outputView) {
    logger.error(`local output was not generated`);
  }
  logger.pass();
}