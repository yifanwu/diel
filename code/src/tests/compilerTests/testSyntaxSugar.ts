import { GenerateUnitTestErrorLogger } from "../../lib/messages";
import { getDielIr, getDielAst } from "../../lib/cli-compiler";
import { DerivedRelation } from "../../parser/dielAstTypes";
import { ExprColumnAst } from "../../parser/exprAstTypes";
import {  getSelectionUnitAst, getVanillaSelectionUnitAst } from "../../compiler/compiler";
import { applyLatestToSelectionUnit, applyLatestToAst } from "../../compiler/passes/syntaxSugar";





let q2 = `
select arrival
from t1
where timestep =
(select max(timestep) from t1);`;

// LUCIE TODO
export function assertLatestSyntax() {

  const logger = GenerateUnitTestErrorLogger("assertBasicOperators", q3);

  compareAST(q3, a3);
  // let selUnit = getVanillaSelectionUnitAst(q2);
  // let ast = getDielAst(q3);
  // console.log(selUnit.whereClause);

  // applyLatestToAst(ast);
  // applyLatestToSelectionUnit(selUnit);

  // do the assertion on the AST ()
  // if (selUnit.baseRelation.isLatest === true) {
  //   logger("transformation failed");
  // }
  return true;
}


// 1. basic
let q1 = `create table filtered as select arrival from LATEST t1;`;
let a1 = `create table filtered as select arrival from t1 where t1.timestep = (select max(timestep) from t1)`;


// 2. where clause should be preserved
let q3 = `create table filtered as
select arrival from LATEST t1 where arrival > 10 and arrival < 20;`;
let a3 = `create table filtered as
select arrival from t1 where arrival > 10 and t1.timestep = (select max(timestep) from t1);`;

// 3. constraints, group by, order by, limit should also be preservered


let q4 = `select a
from latest t1
join t2 on t1.b = t2.b;`;

let a4 = `select a
from t1
join t2 on t1.b = t2.b
where t1.timestep = (select max(timestep) from t1);`;



const assert = require("assert");

function compareAST(q1: string, q2: string) {
  let ast1 = getDielAst(q1);
  let ast2 = getDielAst(q2);
  assert.deepEqual(ast1, ast2);
}