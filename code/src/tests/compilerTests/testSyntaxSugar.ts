import { GenerateUnitTestErrorLogger } from "../../lib/messages";
import { getDielIr, getDielAst } from "../../lib/cli-compiler";
import { DerivedRelation } from "../../parser/dielAstTypes";
import { ExprColumnAst } from "../../parser/exprAstTypes";
import { getSelectionUnitAst, getVanillaSelectionUnitAst } from "../../compiler/compiler";
import { applyLatestToSelectionUnit, applyLatestToAst } from "../../compiler/passes/syntaxSugar";

// LUCIE TODO
export function assertLatestSyntax() {
  let q = `
  select arrival from LATEST t1;
  `;
  const logger = GenerateUnitTestErrorLogger("assertBasicOperators", q);
  let ast = getVanillaSelectionUnitAst(q);
  console.log(ast);
  // applyLatestToAst(ast);
  // applyLatestToSelectionUnit(ast);
  // do the assertion on the AST ()
  return true;
}
