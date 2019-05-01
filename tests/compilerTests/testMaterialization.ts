import { CompileAst, ParsePlainDielAst } from "../../src/compiler/compiler";
import { DielAst } from "../../src/parser/dielAstTypes";
import { TransformAstForMaterialization } from "../../src/compiler/passes/materialization";
import { GenerateUnitTestErrorLogger } from "../testHelper";
import { TestLogger } from "../testTypes";
import { SqlAst, CreateEmptySqlAst, TriggerAst } from "../../src/parser/sqlAstTypes";
import { GetSqlOriginalRelationFromDielRelation, GetSqlDerivedRelationFromDielRelation } from "../../src/compiler/passes/distributeQueries";
import { GetOriginalRelations, GetAllDerivedViews } from "../../src/compiler/DielAstGetters";

export function testMaterialization() {
  const logger = GenerateUnitTestErrorLogger("assertBasicMaterialization");
  for (let test of tests) {
    let query = test[0];
    let answer = test[1];
    let ast = ParsePlainDielAst(query);
    CompileAst(ast);
    let sqlAST = transformSqlASTFromDielAST(ast);
    TransformAstForMaterialization(sqlAST);
    compareAST(answer, sqlAST, logger);
  }
  logger.pass();
}

export function transformSqlASTFromDielAST(ast: DielAst): SqlAst {
    let sqlAST = CreateEmptySqlAst();
    // the logic is same as in DielPhysicalExecution.ts
    GetOriginalRelations(ast).map(r => {
        const sqlOriginal = GetSqlOriginalRelationFromDielRelation(r);
        if (sqlOriginal) sqlAST.relations.push(sqlOriginal);
        console.log(r.rName);
    });
    GetAllDerivedViews(ast).map(r => {
        const sqlDerived = GetSqlDerivedRelationFromDielRelation(r);
        if (sqlDerived) sqlAST.relations.push(sqlDerived);
        console.log(r.rName);

    });

    sqlAST.commands = ast.commands;

    const triggers: TriggerAst[] = [];
    const programsToAddRaw = ast.programs.get("");
    const programsToAdd = programsToAddRaw ? programsToAddRaw : [];
    ast.programs.forEach((v, input) => {
      triggers.push({
        tName: `${input}Trigger`, // inputs are unique since its a map
        afterRelationName: input,
        commands: [...programsToAdd, ...v ],
      });
    });
    sqlAST.triggers = triggers;
    return sqlAST;
}

function compareAST(query: string, ast2: SqlAst, logger: TestLogger) {
  let ast = ParsePlainDielAst(query);
  CompileAst(ast);
  const ast1 = transformSqlASTFromDielAST(ast);

  ast1.relations = ast1.relations.sort((a, b) => (a.rName > b.rName) ? 1 : 0);
  ast2.relations = ast1.relations.sort((a, b) => (a.rName > b.rName) ? 1 : 0);

  let pretty1 = JSON.stringify(ast1, null, 2);
  let pretty2 = JSON.stringify(ast2, null, 2);

  if (pretty1 !== pretty2) {
    logger.error(`${pretty1} is not the same as ${pretty2}.`);
  }
}

// 1. simple. Materialize v1
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

create table v1 (aPrime integer);
create program after (t1)
	begin
		delete from v1;
		insert into v1 select a + 1 as aPrime from t1 where a > 2;
  end;

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

create table v1 (aPrime integer);
create program after (t1)
	begin
		delete from v1;
		insert into v1 select a + 1 as aPrime from t1 where a > 2;
  end;

create table v2 (aPrime integer);
create program after (t2)
	begin
		delete from v2;
		insert into v2 select a + 1 as aPrime from t2 where a > 2;
  end;

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

create table v2 (aPrime integer);
create program after (t2)
	begin
		delete from v2;
		insert into v2 select a + 1 as aPrime from t2 where a > 2;
  end;

create view v3 as select a + 1 as aPrime from t3 where a > 2;

create output o1 as select aPrime from v1 join v2 on aPrime = a;
create output o2 as select aPrime from v2 join v3 on aPrime = a;
`;

// 4. nested views. Materialize just v2. v2 is still dependent on v1.
let q4 =
`
create event table t1 (a integer);

create view v1 as select a + 1 as aPrime from t1 where a > 2;
create view v2 as select a + 1 as aPrime from v1 where a > 2;

create output o1 as select aPrime from v2 where aPrime = a;
create output o2 as select aPrime from v2 where aPrime = a;
`;

let a4 =
`
create event table t1 (a integer);

create view v1 as select a + 1 as aPrime from t1 where a > 2;

create table v2 (aPrime integer);
create program after (t1)
	begin
		delete from v2;
		insert into v2 select a + 1 as aPrime from v1 where a > 2;
  end;

create output o1 as select aPrime from v2 where aPrime = a;
create output o2 as select aPrime from v2 where aPrime = a;
`;


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

create table v1 (aPrime integer, aPPrime integer);
create program after (t1)
	begin
		delete from v1;
    insert into v1
        select a + 1 as aPrime, a+2 as aPPrime from LATEST t1
        where aPrime > 10
        group by aPPrime
        order by count DESC
        limit 10;
  end;

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

let a6 = `

create event table t1 (a integer);
create event table t2 (a integer);

create table v1 (aPrime integer);
create program after (t1, t2)
	begin
		delete from v1;
    insert into v1
      select a + 1 as aPrime from t1 join t2 on t1.a = t2.a;

  end;

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

create table v1 (v1Prime integer);
create program after (t1)
  begin
    delete from v1;
    insert into v1 select a + 1 as v1Prime from t1;
  end;

create table v2 (v2Prime integer);
create program after (t1)
  begin
    delete from v2;
    insert into v2 select v1Prime + 1 as v2Prime from v1;
  end;

create output o1 as select v1Prime from v1;
create output o2 as select v2Prime from v2;
create output o3 as select v2Prime from v2;
`
;

let tests = [
[q1, a1],
[q2, a2],
[q3, a3],
[q4, a4],
[q5, a5],
[q6, a6],
[q7, a7]
];
