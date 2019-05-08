import { DbType } from "../src";
import { DielPhysicalExecution } from "../src/compiler/DielPhysicalExecution";
import { CompileAst, ParsePlainDielAst } from "../src/compiler/compiler";
import { LogicalTimestep } from "../src/parser/dielAstTypes";
import {  generateStringFromSqlIr } from "../src/compiler/codegen/codeGenSql";

export function testTriTableCreation() {
  const query = `
    create table data (datum integer);
  
    create event table click (num integer);
    create event view myclicks as select num from click
    join data on datum == num;

    create output o1 as select max(num) from myclicks;
    `
  const physicalMetaData = {
    dbs: new Map([[1, {dbType: DbType.Local}]]),
    relationLocation: new Map(),
    cache: true,
  };

  const ast = ParsePlainDielAst(query);
  CompileAst(ast);
  
  const getEventByTimestep = (n: LogicalTimestep) => "";

  let physicalExecution = new DielPhysicalExecution(ast, physicalMetaData, getEventByTimestep);

  let sqlAst = physicalExecution.sqlAstSpecPerDb.get(1);
  let withcaching = generateStringFromSqlIr(sqlAst);

  // without caching...
  physicalMetaData.cache = false;
  physicalExecution = new DielPhysicalExecution(ast, physicalMetaData, getEventByTimestep);

  sqlAst = physicalExecution.sqlAstSpecPerDb.get(1);
  const strs = generateStringFromSqlIr(sqlAst);

  withcaching.forEach(s =>
    console.log(s));

  console.log("Without caching...");


  strs.forEach(s =>
    console.log(s));


}
