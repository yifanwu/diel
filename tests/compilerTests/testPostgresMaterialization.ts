import { GenerateUnitTestErrorLogger } from "../testHelper";
import { ParsePlainDielAst, CompileAst } from "../../src/compiler/compiler";
import { DbType, DbDriver } from "../../src";
import { LogicalTimestep, Relation, DbIdType } from "../../src/parser/dielAstTypes";
import { DielPhysicalExecution, LocalDbId } from "../../src/compiler/DielPhysicalExecution";
import { stringify } from "querystring";
import { TableMetaData }from "../../src/runtime/runtimeTypes";
import { SqlDerivedRelation } from "../../build/src/parser/sqlAstTypes";

export function testMaterializationPostgres() {
  // TODO
  const query = `
    create event table t1 (a integer);
    create event table t2 (a integer);

    create view v1 as select a + 1 as aPrime from t1 where a > 2;

    create output o1 as select aPrime from v1 join t2 on aPrime = a;
    create output o2 as select aPrime from v1 join t3 on aPrime = a;
  `;

  const logger = GenerateUnitTestErrorLogger("testMaterializatioPostgres", query);
  const ast = ParsePlainDielAst(query);
  CompileAst(ast);

  const physicalMetaData = {
    dbs: new Map([
      [1, {dbType: DbType.Local, dbDriver: DbDriver.Postgres}]
    ]),
    relationLocation: new Map(),
  };
  const getEventByTimestep = (n: LogicalTimestep) => "";

  const addRelationToDielMock = (r: Relation) => {};
  const physicalExecution = new DielPhysicalExecution(ast, physicalMetaData, getEventByTimestep, addRelationToDielMock);
  const sqlAst = physicalExecution.getAstFromDbId(LocalDbId);
  // assertions on sqlAst for materialization
  sqlAst.relations.forEach(relation => {
    if (relation.rName === "v1" && !(<SqlDerivedRelation> relation).isMaterialized) {
      logger.error("v1 should be materialized");
    }
  });
  logger.pass();
}