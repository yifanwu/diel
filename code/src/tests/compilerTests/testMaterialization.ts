import { GenerateUnitTestErrorLogger, LogInfo } from "../../lib/messages";
import { getDielIr, getDielAst } from "../../lib/cli-compiler";
import { DerivedRelation, DielAst } from "../../parser/dielAstTypes";
import { ExprColumnAst } from "../../parser/exprAstTypes";
import {  getSelectionUnitAst, getVanillaSelectionUnitAst } from "../../compiler/compiler";
import { applyLatestToSelectionUnit, applyLatestToAst } from "../../compiler/passes/syntaxSugar";
import {generateSqlFromDielAst, generateSelectionUnit} from "../../../src/compiler/codegen/codeGenSql";
import { ConsoleErrorListener } from "antlr4ts";
import { TransformAstForMaterialization } from "../../compiler/passes/materialization";
import { DielIr } from "../../lib";
import { NormalizeColumnSelection } from "../../compiler/passes/normalizeColumnSelection";

var jsonDiff = require("json-diff");


export function testMaterialization() {
  for (let test of tests) {
    var query = test[0];
    var answer = test[1];
    const logger = GenerateUnitTestErrorLogger("assertBasicMaterialization", query);
    let ast = getDielAst(query);
    TransformAstForMaterialization(ast);
    compareAST(answer, ast, logger, true);
  }
}


function compareAST(query: string, ast2: DielAst, logger: any, logdiff: boolean) {
  let ast1 = getDielAst(query);
  let ir1 = new DielIr(ast1);
  NormalizeColumnSelection(ir1);

  let pretty1 = JSON.stringify(ast1.relations[6], null, 2);
  let pretty2 = JSON.stringify(ast2.relations[6], null, 2);

  let diff = jsonDiff.diff(pretty1, pretty2);

  console.log("============ Result ==============");

  // compare the programs!!!!!!!!!
  let map1 = JSON.stringify(Array.from(ast1.programs));
  let map2 = JSON.stringify(Array.from(ast2.programs));

  if (map1 !== map2) {
    console.log(map1);
    console.log(map2);
    console.log("\x1b[34m Failed. Programs not the same \x1b[0m");
    return;
  }



  if (diff !== undefined) {
    if (logdiff) {
    console.log(JSON.parse(diff.__old));
    console.log(JSON.parse(diff.__new));
    }
    console.log("\x1b[34m Failed \x1b[0m");

    // logger("AST NOT THE SAME");
    console.log("=================================");
  } else {
    console.log("\x1b[31m PASSED \x1b[0m");
    console.log("=================================");

  }
}

// 1. simple. Materialize v1
let q1 =
`
create table t1 (a integer);
create table t2 (a integer);
create table t3 (a integer);

create view v1 as select a + 1 as aPrime from t1 where a > 2;

create output o1 as select aPrime from v1 join t2 on aPrime = a;
create output o2 as select aPrime from v1 join t3 on aPrime = a;
`;

let a1 =
`
create table t1 (a integer);
create table t2 (a integer);
create table t3 (a integer);

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
create table t1 (a integer);
create table t2 (a integer);

create view v1 as select a + 1 as aPrime from t1 where a > 2;
create view v2 as select a + 1 as aPrime from t2 where a > 2;

create output o1 as select aPrime from v1 join v2 on aPrime = a;
create output o2 as select aPrime from v2 join v1 on aPrime = a;
`;


let a2 =
`
create table t1 (a integer);
create table t2 (a integer);

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
create table t1 (a integer);
create table t2 (a integer);
create table t3 (a integer);

create view v1 as select a + 1 as aPrime from t1 where a > 2;
create view v2 as select a + 1 as aPrime from t2 where a > 2;
create view v3 as select a + 1 as aPrime from t3 where a > 2;

create output o1 as select aPrime from v1 join v2 on aPrime = a;
create output o2 as select aPrime from v2 join v3 on aPrime = a;
`;

let a3 =
`
create table t1 (a integer);
create table t2 (a integer);
create table t3 (a integer);

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
create table t1 (a integer);

create view v1 as select a + 1 as aPrime from t1 where a > 2;
create view v2 as select a + 1 as aPrime from v1 where a > 2;

create output o1 as select aPrime from v2 where aPrime = a;
create output o2 as select aPrime from v2 where aPrime = a;
`;

let a4 =
`
create table t1 (a integer);

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
create table t1 (a integer);

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
create table t1 (a integer);

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
create table t1 (a integer);
create table t2 (a integer);

create view v1 as
select a + 1 as aPrime from t1 join t2 on t1.a = t2.a;

create output o1 as select aPrime from v1 where aPrime = a;
create output o2 as select aPrime from v1 where aPrime = a;

`;

let a6 = `

create table t1 (a integer);
create table t2 (a integer);

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



// 7. FOR LATER! how do you handle view constraints..?

let q7 = `
create table t1 (a integer);

create view v1 as
select a + 1 as aPrime, a+2 as aPPrime from LATEST t1
where aPrime > 10
group by aPPrime
order by count DESC
limit 10;

create output o1 as select aPrime from v1 where aPrime = a;
create output o2 as select aPrime from v1 where aPrime = a;

`;

let a7 = `
create table t1 (a integer);

create table v1 (aPrime integer, aPPrime integer);
create program after (t1)
	begin
		delete from v1;
    insert into v1
        select a + 1 as aPrime, a+2 as aPPrime from LATEST t1
        where aPrime > 10
        group by aPPrime
        order by count DESC
        limit 10
        constrain check (aPrime > 10);
  end;

create output o1 as select aPrime from v1 where aPrime = a;
create output o2 as select aPrime from v1 where aPrime = a;

`;

let tests = [[q1, a1], [q2, a2], [q3, a3], [q4, a4], [q5, a5], [q6, a6]];