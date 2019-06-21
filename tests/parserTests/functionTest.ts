import { ExprFunAst, FunctionType, DerivedRelation, DielAst, ExprType } from "../../src/parser/dielAstTypes";
import { GenerateUnitTestErrorLogger } from "../testHelper";
import { GetRelationDef } from "../../src/compiler/DielAstGetters";

export function assertFunctionParsing(ast: DielAst, q: string) {
  const logger = GenerateUnitTestErrorLogger("assertFunctionParsing", q);
  const v3Relation = GetRelationDef(ast, "v3") as DerivedRelation;
  const v3Where = (v3Relation.selection.compositeSelections[0].relation.whereClause as ExprFunAst);
  if (v3Where.functionType !== FunctionType.BuiltIn) {
    logger.error(`Didn't parse the function properly,  Got: ${JSON.stringify(v3Where, null, 2)}`);
  }
  const v4Relation = GetRelationDef(ast, "v4") as DerivedRelation;
  const v4SelectClause = v4Relation.selection.compositeSelections[0].relation.derivedColumnSelections[0];
  if (v4SelectClause.expr.exprType !== ExprType.Func) {
    logger.error(`Didn't parse the function for v4 properly---we expected the datetime function, but got: ${JSON.stringify(v4SelectClause, null, 2)}`);
  }
  const funcExpr = v4SelectClause.expr as ExprFunAst;
  if (funcExpr.args.length !== 2) {
    logger.error(`Datetime was called with column a and string!, but got ${JSON.stringify(funcExpr.args, null, 2)}`);
  }
  logger.pass();
  return true;
}