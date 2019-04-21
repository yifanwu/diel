import { getDielIr, getDielAst } from "../../src/compiler/compiler";
import { DielAst } from "../../src/parser/dielAstTypes";
import { TransformAstForMaterializationOP } from "../../src/compiler/passes/materializationOP";
import { GenerateUnitTestErrorLogger } from "../testHelper";
import { TestLogger } from "../testTypes";
import { generateSqlFromDielAst } from "../../src/compiler/codegen/codeGenSql";

export function testMaterializationOpLevel() {
  const logger = GenerateUnitTestErrorLogger("testMaterializationOpLevel");
  let ir = getDielIr(q2);
  TransformAstForMaterializationOP(ir.ast);
  let sql1 = generateSqlFromDielAst(ir.ast);

  let ir2 = getDielIr(a2);
  let sql2 = generateSqlFromDielAst(ir2.ast);
  if (sql1.length !== sql2.length) {
    logger.error("length not the same");
  }
  for (let i in sql1) {
    if (sql1[i] !== sql2[i]) {
      logger.error(`sql not the same ${sql1[i]} ${sql2[i]}`);
    }
    console.log(sql1[i]);
  }
  logger.pass();
}

// Q: when do you update vs insert?
// update when there is aggregate function or groupby clause

// LATER:
// if we insert, we need to create another trigger program for delete..

let q = `insert into v1 select new.a + 1 as aPrime;`;

// 1. most basic test--insert instead of update?
let q1 =
`
create table t1 (a integer);

create view v1 as select t1.a + 1 as aPrime from t1;

create output o1 as select aPrime + 1 from v1;
create output o2 as select aPrime + 2 from v1;
`;

let a1 =
`
create table t1 (a integer);

create table v1 (aPrime integer);

insert into v1 select t1.a + 1 as aPrime from t1;
create program after (t1)
	begin
    insert into v1 select new.a + 1 as aPrime;
  end;

create output o1 as select aPrime + 1 from v1;
create output o2 as select aPrime + 2 from v1;
`;

let q1_1 =
`
create table t1 (a integer);

create view v1 as select a + 1 as aPrime from t1;

create output o1 as select aPrime + 1 from v1;
create output o2 as select aPrime + 2 from v1;
`;

let a1_1 =
`
create table t1 (a integer);

create table v1 (aPrime integer);

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
create table t1 (a integer);
create table t2 (b integer);

create view v1 as select t1.a + 1 as aPrime from t1, t2 where t1.a = t2.b;

create output o1 as select aPrime + 1 from v1;
create output o2 as select aPrime + 2 from v1;
`;


let a2 =
`
create table t1 (a integer);
create table t2 (b integer);

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
