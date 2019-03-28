import { GenerateUnitTestErrorLogger, LogInfo } from "../../lib/messages";
import { getDielIr, getDielAst } from "../../lib/cli-compiler";
import { DerivedRelation, DielAst } from "../../parser/dielAstTypes";
import { ExprColumnAst } from "../../parser/exprAstTypes";
import {  getSelectionUnitAst, getVanillaSelectionUnitAst } from "../../compiler/compiler";
import { applyLatestToSelectionUnit, applyLatestToAst } from "../../compiler/passes/syntaxSugar";
import {generateSqlFromDielAst, generateSelectionUnit} from "../../../src/compiler/codegen/codeGenSql";
import { ConsoleErrorListener } from "antlr4ts";

var jsonDiff = require("json-diff");

// LUCIE TODO
export function assertLatestSyntax() {

  for (let test of tests) {
    var query = test[0];
    var answer = test[1];
    const logger = GenerateUnitTestErrorLogger("assertBasicOperators", query);
    let ast = getDielAst(query);
    applyLatestToAst(ast);
    compareAST(answer, ast, logger, true);
  }

}

export function compareAST(q1: string, ast2: DielAst, logger: any, logdiff: boolean) {
  let ast1 = getDielAst(q1);
  let pretty1 = JSON.stringify(ast1, null, 2);
  let pretty2 = JSON.stringify(ast2, null, 2);
  let diff = jsonDiff.diff(pretty1, pretty2);

  console.log("============ Query ==============");
  // var sqls = generateSqlFromDielAst(ast2);
  // console.log("Converted:\n\n", sqls[0], "\n");

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