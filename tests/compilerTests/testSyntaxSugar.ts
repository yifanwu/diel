import { ParsePlainDielAst, ParsePlainSelectQueryAst } from "../../src/compiler/compiler";
import { DielAst, SelectionUnit } from "../../src/parser/dielAstTypes";
import { applyLatestToAst, applyLatestToSelectionUnit } from "../../src/compiler/passes/syntaxSugar";
import { GenerateUnitTestErrorLogger } from "../testHelper";
import { TestLogger } from "../testTypes";
import { SqlStrFromSelectionUnit } from "../../src/compiler/codegen/codeGenSql";

export function assertLatestSyntax() {
  const logger = GenerateUnitTestErrorLogger("assertLatestSyntax");
  for (let test of tests) {
    let query = test[0];
    let answer = test[1];
    const qAst = ParsePlainSelectQueryAst(query);
    const aAst = ParsePlainSelectQueryAst(answer);
    const unit = qAst.compositeSelections[0].relation;
    applyLatestToSelectionUnit(unit);
    compareAST(aAst.compositeSelections[0].relation, unit, logger);
  }
  logger.pass();
}

/**
 */
function compareAST(ast1: SelectionUnit, ast2: SelectionUnit, logger: TestLogger) {
  // console.log(JSON.stringify);
  // Note that relying on JSON stringify is too brittle
  // but we can use our own ast to sql string functions!
  const q1 = SqlStrFromSelectionUnit(ast1);
  const q2 = SqlStrFromSelectionUnit(ast2);
  // let pretty1 = JSON.stringify(ast1, null, 2);
  // let pretty2 = JSON.stringify(ast2, null, 2);

  if (q1 !== q2) {
    logger.error(`\n${q1}\n\nis not the same as\n\n${q2}`);
  }
}

// 1. basic
let q1 = `select arrival from LATEST t1;`;

let a1 = `
select arrival
from t1
where t1.timestep = (select max(timestep) from t1);`;


// 2. where clause should be preserved
let q2 = `
select arrival
from LATEST t1
where arrival > 10
and arrival < 20;`;

let a2 = `
select arrival
from t1
where arrival > 10
and arrival < 20
and t1.timestep = (select max(timestep) from t1);`;

// 3. constraints, group by, order by, limit should also be preservered
let q3 = `
select count(*), arrival from LATEST t1
where arrival > 10
group by arrival
order by count DESC
limit 10
constrain check (arrival > 10);`;

let a3 = `
select count(*), arrival from t1
where arrival > 10
and t1.timestep = (select max(timestep) from t1)
group by arrival
order by count DESC
limit 10
constrain check (arrival > 10);`;


// 4. in case of joins, latest should be applied to immediate relations
let q4 = `
select a
from latest t1
join t2 on t1.b = t2.b;`;

let a4 = `
select a
from t1
join t2 on t1.b = t2.b
where t1.timestep = (select max(timestep) from t1);`;


// 5. check multiple latest for explicit join
let q5 = `
select a
from latest t1
join latest t2 on t1.b = t2.b;`;

let a5 = `
select a
from t1 join t2 on t1.b = t2.b
where t1.timestep = (select max(timestep) from t1)
and t2.timestep = (select max(timestep) from t2);`;


// 6. check multiple latest for implicit join
let q6 = `
select a
from latest t1, latest t2
where t1.b = t2.b;`;

let a6 = `
select a
from t1, t2
where t1.b = t2.b
and t1.timestep = (select max(timestep) from t1)
and t2.timestep = (select max(timestep) from t2);`;


// 7. check multiple tables
let q7 =  `
select a
from latest t1, t2
where t1.b = t2.b ;`;

let a7 = `
select a
from t1, t2
where t1.b = t2.b
and t1.timestep = (select max(timestep) from t1);`;

let tests = [[q1, a1], [q2, a2], [q3, a3], [q4, a4], [q5, a5], [q6, a6], [q7, a7]];