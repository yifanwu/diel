import { GenerateUnitTestErrorLogger } from "../../lib/messages";
import { getDielIr, getDielAst } from "../../lib/cli-compiler";
import { DerivedRelation } from "../../parser/dielAstTypes";
import { ExprColumnAst } from "../../parser/exprAstTypes";
import {  getSelectionUnitAst, getVanillaSelectionUnitAst } from "../../compiler/compiler";
import { applyLatestToSelectionUnit, applyLatestToAst } from "../../compiler/passes/syntaxSugar";



let q1 = `
  create table filtered as select arrival from LATEST t1;
  `;

let q2 = `
select arrival
from t1
where timestep =
(select max(timestep) from t1);`;

// LUCIE TODO
export function assertLatestSyntax() {

  const logger = GenerateUnitTestErrorLogger("assertBasicOperators", q2);
  let selUnit = getVanillaSelectionUnitAst(q2);
  console.log(selUnit);

    // let ast = getDielAst(q2);
  // applyLatestToAst(ast);
  // applyLatestToSelectionUnit(selUnit);

  // do the assertion on the AST ()
  // if (selUnit.baseRelation.isLatest === true) {
  //   logger("transformation failed");
  // }
  return true;
}

