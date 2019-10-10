import { GenerateUnitTestErrorLogger } from "../testHelper";
import { ParsePlainDielAst, CompileAst } from "../../src/compiler/compiler";
import { DbType, DbDriver } from "../../src";
import { LogicalTimestep, Relation } from "../../src/parser/dielAstTypes";
import { DielPhysicalExecution, LocalDbId } from "../../src/compiler/DielPhysicalExecution";
import { SqlAst,  } from "../../src/parser/sqlAstTypes";
import { TestLogger } from "../testTypes";
import { generateStringFromSqlIr } from "../../src/compiler/codegen/codeGenSql";

const physicalMetaData = {
    dbs: new Map([[1, {dbType: DbType.Local, dbDriver: DbDriver.Postgres}]]),
    relationLocation: new Map(),
};
const getEventByTimestep = (n: LogicalTimestep) => "";
const addRelationToDielMock = (r: Relation) => {};

export function testMaterializationPostgres() {
    const logger = GenerateUnitTestErrorLogger("assertPostgresMaterialization");

    for (let test of tests) {
        const query = test[0];
        const answer = test[1];
        const ast = ParsePlainDielAst(query);
        CompileAst(ast);

        const physicalExecution = new DielPhysicalExecution(ast, physicalMetaData, getEventByTimestep, addRelationToDielMock);
        const sqlAst = physicalExecution.getAstFromDbId(LocalDbId);
        compareAST(answer, sqlAst, logger);
    }
    logger.pass();
}


function compareAST(query: string, sqlAst2: SqlAst, logger: TestLogger) {
    const ast1 = ParsePlainDielAst(query);
    CompileAst(ast1);
    const physicalExecution1 = new DielPhysicalExecution(ast1, physicalMetaData, getEventByTimestep, addRelationToDielMock);
    const sqlAst1 = physicalExecution1.getAstFromDbId(LocalDbId);

    function compare(a: any, b: any, property: string) {
        if (a[property] < b[property]) return -1;
        if (a[property] > b[property]) return 1;
        return 0;
    }

    sqlAst1.relations.sort((a, b) => compare(a, b, "rName"));
    sqlAst2.relations.sort((a, b) => compare(a, b, "rName"));
    sqlAst1.triggers.sort((a, b) => compare(a, b, "tName"));
    sqlAst2.triggers.sort((a, b) => compare(a, b, "tName"));

    let relation1 = JSON.stringify(sqlAst1.relations, null, 2);
    let relation2 = JSON.stringify(sqlAst2.relations, null, 2);
    let command1 = JSON.stringify(Array.from(sqlAst1.commands));
    let command2 = JSON.stringify(Array.from(sqlAst2.commands));
    let trigger1 = JSON.stringify(Array.from(sqlAst1.triggers), null, 2);
    let trigger2 = JSON.stringify(Array.from(sqlAst2.triggers), null, 2);

    // let array1 = relation1.split("\n");
    // let array2 = relation2.split("\n");
    // for (let i in array1) {
    //     if (array1[i] !== array2[i]) {
    //         logger.error(`line ${i}: ${array1[i]} is not the same as ${array2[i]}.`);
    //     }
    // }
    if (relation1 !== relation2) {
        logger.error(`${relation1} is not the same as ${relation2}.`);
    }
    if (command1 !== command2) {
        logger.error(`${command1} is not the same as ${command2}.`);
    }

    if (trigger1 !== trigger2) {
        logger.error(`${trigger1} is not the same as ${trigger2}.`);
    }
    // console.log(generateStringFromSqlIr(sqlAst1));
    // console.log(generateStringFromSqlIr(sqlAst2));
}

// // 1. simple. Materialize v1
let q1 =
`
create event table t1 (a integer);
create event table t2 (a integer);
create event table t3 (a integer);

create view v1 as select a + 1 as aPrime from t1 where a > 2;

create output o1 as select aPrime from v1 join t2 on aPrime = a;
create output o2 as select aPrime from v1 join t3 on aPrime = a;
`;

let a1 =
`
create event table t1 (a integer);
create event table t2 (a integer);
create event table t3 (a integer);

create materialized view v1 as select a + 1 as aPrime from t1 where a > 2;

create output o1 as select aPrime from v1 join t2 on aPrime = a;
create output o2 as select aPrime from v1 join t3 on aPrime = a;
`;

// 2. multiple views to materialize horizontally. Materialize v1, v2
let q2 =
`
create event table t1 (a integer);
create event table t2 (a integer);

create view v1 as select a + 1 as aPrime from t1 where a > 2;
create view v2 as select a + 1 as aPrime from t2 where a > 2;

create output o1 as select aPrime from v1 join v2 on aPrime = a;
create output o2 as select aPrime from v2 join v1 on aPrime = a;
`;


let a2 =
`
create event table t1 (a integer);
create event table t2 (a integer);

create materialized view v1 as select a + 1 as aPrime from t1 where a > 2;
create materialized view v2 as select a + 1 as aPrime from t2 where a > 2;

create output o1 as select aPrime from v1 join v2 on aPrime = a;
create output o2 as select aPrime from v2 join v1 on aPrime = a;
`
;

// 3. only views that have more than 1 dependency. Materialize v2
let q3 =
`
create event table t1 (a integer);
create event table t2 (a integer);
create event table t3 (a integer);

create view v1 as select a + 1 as aPrime from t1 where a > 2;
create view v2 as select a + 1 as aPrime from t2 where a > 2;
create view v3 as select a + 1 as aPrime from t3 where a > 2;

create output o1 as select aPrime from v1 join v2 on aPrime = a;
create output o2 as select aPrime from v2 join v3 on aPrime = a;
`;

let a3 =
`
create event table t1 (a integer);
create event table t2 (a integer);
create event table t3 (a integer);

create view v1 as select a + 1 as aPrime from t1 where a > 2;
create materialized view v2 as select a + 1 as aPrime from t2 where a > 2;
create view v3 as select a + 1 as aPrime from t3 where a > 2;

create output o1 as select aPrime from v1 join v2 on aPrime = a;
create output o2 as select aPrime from v2 join v3 on aPrime = a;
`;

// // 4. nested views. Materialize just v2. v2 is still dependent on v1.
// this actually works, but there's no way to check it with physical execution
// since v1 is only a view and it's not included in the distribution
// let q4 =
// `
// create event table t1 (a integer);

// create view v1 as select a + 1 as aPrime from t1 where a > 2;
// create view v2 as select aPrime + 1 as aaPrime from v1 where aPrime > 2;

// create output o1 as select aaPrime from v2 join t1 on aaPrime = a;
// create output o2 as select aaPrime from v2 join t1 on aaPrime = a;
// `;

// let a4 =
// `
// create event table t1 (a integer);

// create view v1 as select a + 1 as aPrime from t1 where a > 2;

// create table v2 (aaPrime integer);
// create program after (t1)
// 	begin
// 		delete from v2;
// 		insert into v2 select aPrime + 1 as aaPrime from v1 where aPrime > 2;
//   end;

// create output o1 as select aaPrime from v2 join t1 on aaPrime = a;
// create output o2 as select aaPrime from v2 join t1 on aaPrime = a;
// `;


// 5. complex view query with Latest
let q5 = `
create event table t1 (a integer);

create view v1 as
select a + 1 as aPrime, a+2 as aPPrime from LATEST t1
where aPrime > 10
group by aPPrime
order by count DESC
limit 10;

create output o1 as select aPrime from v1 where aPrime = a;
create output o2 as select aPrime from v1 where aPrime = a;

`;

let a5 = `
create event table t1 (a integer);

create materialized view v1 as
select a + 1 as aPrime, a+2 as aPPrime from LATEST t1
where aPrime > 10
group by aPPrime
order by count DESC
limit 10;

create output o1 as select aPrime from v1 where aPrime = a;
create output o2 as select aPrime from v1 where aPrime = a;

`;

// 6.  view join query
let q6 =
`
create event table t1 (a integer);
create event table t2 (a integer);

create view v1 as
select a + 1 as aPrime from t1 join t2 on t1.a = t2.a;

create output o1 as select aPrime from v1 where aPrime = a;
create output o2 as select aPrime from v1 where aPrime = a;

`;

let a6 =
`
create event table t1 (a integer);
create event table t2 (a integer);

create materialized view v1 as
select a + 1 as aPrime from t1 join t2 on t1.a = t2.a;

create output o1 as select aPrime from v1 where aPrime = a;
create output o2 as select aPrime from v1 where aPrime = a;

`;


/**
 * 7. Deep Tree
Materialize v1, v2
        t1
         |
         v1
        /  \
       o1  v2
          /  \
         o2   o3
*/
let q7 =
`
create event table t1 (a integer);

create view v1 as select a + 1 as v1Prime from t1;
create view v2 as select v1Prime + 1 as v2Prime from v1;

create output o1 as select v1Prime from v1;
create output o2 as select v2Prime from v2;
create output o3 as select v2Prime from v2;
`
;

let a7 =
`
create event table t1 (a integer);

create materialized view v1 as select a + 1 as v1Prime from t1;
create materialized view v2 as select v1Prime + 1 as v2Prime from v1;

create output o1 as select v1Prime from v1;
create output o2 as select v2Prime from v2;
create output o3 as select v2Prime from v2;
`
;

let tests = [
[q1, a1],
[q2, a2],
[q3, a3],
[q5, a5],
[q6, a6],
[q7, a7]
];
