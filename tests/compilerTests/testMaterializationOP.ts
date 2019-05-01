import { CompileAst, ParsePlainDielAst } from "../../src/compiler/compiler";
import { TransformAstForMaterializationOP } from "../../src/compiler/passes/materializationOP";
import { GenerateUnitTestErrorLogger } from "../testHelper";
import { transformSqlASTFromDielAST, sortRelations } from "./testMaterialization";
import { generateStringFromSqlIr } from "../../src/compiler/codegen/codeGenSql";
import { FgGray, FgMagenta, Reset} from "../../src/util/messages";

export function testMaterializationOP() {
  const logger = GenerateUnitTestErrorLogger("testMaterializationOpLevel");
  for (let test of tests) {
    const q = test[0];
    const a = test[1];
    let ast = ParsePlainDielAst(q);
    CompileAst(ast);
    let sqlAST = transformSqlASTFromDielAST(ast);
    TransformAstForMaterializationOP(sqlAST);
    sqlAST.relations = sqlAST.relations.sort(sortRelations);
    let sql1 = generateStringFromSqlIr(sqlAST);

    let ast2 = ParsePlainDielAst(a);
    CompileAst(ast2);
    const sqlAST2 = transformSqlASTFromDielAST(ast2);
    sqlAST2.relations = sqlAST2.relations.sort(sortRelations);
    let sql2 = generateStringFromSqlIr(sqlAST2);

    console.log(`Translating: \n${FgGray}`, q, `${Reset}`);
    // if (sql1.length !== sql2.length) {
    //   logger.error("length not the same");
    // }
    for (let i in sql1) {
      // if (sql1[i].replace(/\s/g, "") !== sql2[i].replace(/\s/g, "")) {
      //   logger.error(`sql not the same ${sql1[i]} ${sql2[i]}`);
      // }
      console.log( `${FgMagenta}`, sql1[i], `${Reset}`);
    }
  }

  logger.pass();
}
// Q: when do you update vs insert?
// update when there is aggregate function or groupby clause

// General principle for insert
// 1. initializing insert, just copy the select statemet from the view, like in view level materialization
// 2. for program insert,
//    delete new table if its the base relation.
//    make the first join relation the base relation
//    copy the predicate of the deleted join into where clause.


// 1. most basic test--insert instead of update?
let q1 =
`
create event table t1 (a integer);

create view v1 as select t1.a + 1 as aPrime from t1;

create output o1 as select aPrime + 1 as aPPrime from v1;
create output o2 as select aPrime + 2 as aPPrime from v1;
`;

let a1 =
`
create event table t1 (a integer);

create event table v1 (aPrime integer);

insert into v1 select t1.a + 1 as aPrime from t1;
create program after (t1)
	begin
    insert into v1 select new.a + 1 as aPrime;
  end;

create output o1 as select aPrime + 1 as aPPrime from v1;
create output o2 as select aPrime + 2 as aPPrime from v1;
`;

let q1_1 =
`
create event table t1 (a integer);

create view v1 as select a + 1 as aPrime from t1;

create output o1 as select aPrime + 1 from v1;
create output o2 as select aPrime + 2 from v1;
`;

let a1_1 =
`
create event table t1 (a integer);

create event table v1 (aPrime integer);

insert into v1 select a + 1 as aPrime from t1;
create program after (t1)
	begin
    insert into v1 select new.a + 1 as aPrime;
  end;

create output o1 as select aPrime + 1 from v1;
create output o2 as select aPrime + 2 from v1;
`;
// 2) from multiple tables. no-join
let q2 =
`
create event table t1 (a integer);
create event table t2 (b integer);

create view v1 as select t1.a + 1 as aPrime from t1, t2 where t1.a = t2.b;

create output o1 as select aPrime + 1 from v1;
create output o2 as select aPrime + 2 from v1;
`;


let a2 =
`
create event table t1 (a integer);
create event table t2 (b integer);

create table v1 (aPrime integer);

insert into v1 select t1.a + 1 as aPrime from t1, t2 where t1.a = t2.b;
create program after (t1)
	begin
    insert into v1 select new.a + 1 as aPrime from t2 where new.a = t2.b;
  end;
create program after (t2)
  begin
    insert into v1 select t1.a + 1 as aPrime from t1 where t1.a = new.b;
  end;

create output o1 as select aPrime + 1 from v1;
create output o2 as select aPrime + 2 from v1;
`;

// 3) multiple tables--Join
let q3 =
`
create event table t1 (a integer);
create event table t2 (b integer);

create view v1 as
  select t1.a + 1 as aPrime, t2.b - 1 as bPrime from t1 join t2 on t1.a + 1 = t2.b + 1
  where t1.a > 10;

create output o1 as select aPrime + 1 from v1;
create output o2 as select aPrime + 2 from v1;
`;

let a3 =
`
create event table t1 (a integer);
create event table t2 (b integer);

create table v1 (aPrime integer, bPrime integer);

insert into v1
  select t1.a + 1 as aPrime, t2.b - 1 as bPrime from t1 join t2 on t1.a + 1 = t2.b + 1 where t1.a > 10;

create program after (t1)
	begin
    insert into v1 select new.a + 1 as aPrime, t2.b - 1 as bPrime from t2
    where new.a + 1 = t2.b + 1
    and new.a > 10;
  end;
create program after (t2)
  begin
    insert into v1 select t1.a + 1 as aPrime, new.b - 1 as bPrime from t1 where t1.a + 1 = new.b + 1
    and t1.a > 10;
  end;

create output o1 as select aPrime + 1 from v1;
create output o2 as select aPrime + 2 from v1;
`;

// 3-1) a lot of joins and where clauses
let q3_1 =
`
create event table t1 (a integer);
create event table t2 (b integer);
create event table t3 (c integer);

create view v1 as
  select t1.a + 1 as aPrime, t2.b + 1 as bPrime, t3.c + 1 as cPrime from t1
  join t2 on t1.a + 1 = t2.b + 1
  join t3 on t1.a = t3.c - 1
  ;

create output o1 as select aPrime + 1 from v1;
create output o2 as select aPrime + 2 from v1;
`;

let a3_1 =
`
create event table t1 (a integer);
create event table t2 (b integer);
create event table t3 (c integer);

create table v1 (aPrime integer, bPrime integer, cPrime integer);

insert into v1
  select t1.a + 1 as aPrime, t2.b + 1 as bPrime, t3.c + 1 as cPrime from t1
  join t2 on t1.a + 1 = t2.b + 1
  join t3 on t1.a = t3.c - 1;

create program after (t1)
	begin
    insert into v1
      select new.a + 1 as aPrime, t2.b + 1 as bPrime, t3.c + 1 as cPrime
      from t2 join t3 on new.a = t3.c - 1
      where new.a + 1 = t2.b + 1;
  end;
create program after (t2)
  begin
    insert into v1
      select t1.a + 1 as aPrime, new.b + 1 as bPrime, t3.c + 1 as cPrime
      from t1 join t3 on t1.a = t3.c - 1
      where t1.a + 1 = new.b + 1;
  end;
create program after (t3)
  begin
    insert into v1
      select t1.a + 1 as aPrime, t2.b + 1 as bPrime, new.c + 1 as cPrime
      from t1
      join t2 on t1.a + 1 = t2.b + 1
      where t1.a = new.c - 1;
  end;

create output o1 as select aPrime + 1 from v1;
create output o2 as select aPrime + 2 from v1;
`;

/**
 * BELOW ARE TESTS FOR FUNCTIONALITEIS NOT IMPLEMENTED
 */

// 4) select clause for column
let q4 =
`
create table t1 (a integer);

create view v1 as
  select (select t1.a + 1 from t1)

create output o1 as select aPrime + 1 from v1;
create output o2 as select aPrime + 2 from v1;
`;

// 5) base relation is a subquery--too complicated..
let q5 =
`
create table t1 (a integer);

create view v1 as b+1 as aPrime from select a+1 as b from t1;

create output o1 as select aPrime + 1 from v1;
create output o2 as select aPrime + 2 from v1;
`
;


// 2. build in function: sum, count. might need to coalesce
let q10 =
`
create event table t1 (a integer);

create view v1 as select sum(a) as sumA, count(a) as countA from t1;

create output o1 as select countA from v1;
create output o2 as select sumA from v1;
`;

let a10 =
`
create event table t1 (a integer);

create table v1 (sumA integer, countA integer);

insert into v1 select sum(a), count(a) from t1;
create program after (t1)
	begin
    update v1 set
      sumVal = (select sumVal + new.a),
      countVal = (select countVal + 1)
      ;
  end;

  create output o1 as select countA from v1;
  create output o2 as select sumA from v1;
`;

// group by order by

const tests = [
[q1, a1],
// [q1_1, a1_1],
// [q2, a2],
// [q3, a3],
// [q3_1, a3_1]
];
