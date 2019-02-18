import { DielIr } from "../../compiler/DielIr";
import { GenerateUnitTestErrorLogger } from "../../lib/messages";
import { ExprFunAst, FunctionType } from "../../parser/exprAstTypes";

export function assertFunctionParsing(ir: DielIr, q: string) {
  const logger = GenerateUnitTestErrorLogger("assertFunctionParsing", q);
  const v3Relation = ir.allDerivedRelations.get("v3");
  const v3Where = (v3Relation[0].relation.whereClause as ExprFunAst);
  if (v3Where.functionType !== FunctionType.BuiltIn) {
    logger(`Didn't parse the function properly,  Got: ${JSON.stringify(v3Where, null, 2)}`);
  }
  return true;
}