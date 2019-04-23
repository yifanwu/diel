import { ParsePlainDielAst } from "../../src/compiler/compiler";
import { DielAst } from "../../src/parser/dielAstTypes";
import { applyLatestToAst } from "../../src/compiler/passes/syntaxSugar";
import { GenerateUnitTestErrorLogger } from "../testHelper";
import { TestLogger } from "../testTypes";

export function assertLatestSyntax() {
  const logger = GenerateUnitTestErrorLogger("assertLatestSyntax");
  for (let test of tests) {
    let query = test[0];
    let answer = test[1];
    let ast = ParsePlainDielAst(query);
    applyLatestToAst(ast);
    compareAST(answer, ast, logger);
  }
  logger.pass();
}

function compareAST(q1: string, ast2: DielAst, logger: TestLogger) {
  let ast1 = ParsePlainDielAst(q1);
  let pretty1 = JSON.stringify(ast1, null, 2);
  let pretty2 = JSON.stringify(ast2, null, 2);

  // console.log("============ Query ==============");
  // console.log("Converted:\n\n", sqls[0], "\n");

  if (pretty1 !== pretty2) {
    logger.error(`${pretty1} is not the same as ${pretty2}.`);
  }
}

// 1. basic
let q1 = `create view filtered as select arrival from LATEST t1;`;

let a1 = `create view filtered as
select arrival
from t1
where t1.timestep = (select max(timestep) from t1);`;


// 2. where clause should be preserved
let q2 = `create view filtered as
select arrival
from LATEST t1
where arrival > 10
and arrival < 20;`;

let a2 = `create view filtered as
select arrival
from t1
where arrival > 10
and arrival < 20
and t1.timestep = (select max(timestep) from t1);`;

// 3. constraints, group by, order by, limit should also be preservered
let q3 = `create view filtered as
select count(*), arrival from LATEST t1
where arrival > 10
group by arrival
order by count DESC
limit 10
constrain check (arrival > 10);`;

let a3 = `create view filtered as
select count(*), arrival from t1
where arrival > 10
and t1.timestep = (select max(timestep) from t1)
group by arrival
order by count DESC
limit 10
constrain check (arrival > 10);`;


// 4. in case of joins, latest should be applied to immediate relations
let q4 = `create view filtered as
select a
from latest t1
join t2 on t1.b = t2.b;`;

let a4 = `create view filtered as
select a
from t1
join t2 on t1.b = t2.b
where t1.timestep = (select max(timestep) from t1);`;


// 5. check multiple latest for explicit join
let q5 = `create view filtered as
select a
from latest t1
join latest t2 on t1.b = t2.b;`;

let a5 = `create view filtered as
select a
from t1 join t2 on t1.b = t2.b
where t1.timestep = (select max(timestep) from t1)
and t2.timestep = (select max(timestep) from t2);`;


// 6. check multiple latest for implicit join
let q6 = `create view filtered as
select a
from latest t1, latest t2
where t1.b = t2.b;`;

let a6 = `create view filtered as
select a
from t1, t2
where t1.b = t2.b
and t1.timestep = (select max(timestep) from t1)
and t2.timestep = (select max(timestep) from t2);`;


// 7. check multiple tables
let q7 =  `create view filtered as
select a
from latest t1, t2
where t1.b = t2.b ;`;

let a7 = `create view filtered as
select a
from t1, t2
where t1.b = t2.b
and t1.timestep = (select max(timestep) from t1);`;

let tests = [[q1, a1], [q2, a2], [q3, a3], [q4, a4], [q5, a5], [q6, a6], [q7, a7]];