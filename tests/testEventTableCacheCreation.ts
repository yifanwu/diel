import { DbType, DerivedRelation } from "../src";
import { DielPhysicalExecution } from "../src/compiler/DielPhysicalExecution";
import { CompileAst, ParsePlainDielAst } from "../src/compiler/compiler";
import { LogicalTimestep, Relation } from "../src/parser/dielAstTypes";
import {  generateStringFromSqlIr, GenerateSqlRelationString } from "../src/compiler/codegen/codeGenSql";
import { GetCachedEventView } from "..//src/compiler/passes/distributeQueries";
import { GetRelationDef } from "..//src/compiler/DielAstGetters";

export function testTriTableCreation() {
  const query = `
    create table data (datum integer);
    create event table click (num integer, pos integer);
    create event view myclicks as select num * num as squared, pos from click
    join data on datum = num;

    create output o1 as select max(squared) as maximum from myclicks;
    `;
  const physicalMetaData = {
    dbs: new Map([[1, {dbType: DbType.Local}], [2, {dbType: DbType.Worker}]]),
    relationLocation: new Map(),
    cache: true,
  };

  physicalMetaData.relationLocation.set("data", {dbType: 2});

  const ast = ParsePlainDielAst(query);
  CompileAst(ast);
  const getEventByTimestep = (n: LogicalTimestep) => "";

  const addRelationToDielMock = (r: Relation) => {};
  let physicalExecution = new DielPhysicalExecution(ast, physicalMetaData, getEventByTimestep, addRelationToDielMock);

  let sqlAst = physicalExecution.sqlAstSpecPerDb.get(1);

  let cacheTriplet = GetCachedEventView(GetRelationDef(ast, "myclicks") as DerivedRelation, true);

  console.log(GenerateSqlRelationString(cacheTriplet.cacheTable));


}
