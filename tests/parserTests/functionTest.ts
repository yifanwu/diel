import { DielIr } from "../../src/compiler/DielIr";
import { GenerateUnitTestErrorLogger } from "../../src/util/messages";
import { ExprFunAst, FunctionType, DerivedRelation } from "../../src/parser/dielAstTypes";

export function assertFunctionParsing(ir: DielIr, q: string) {
  const logger = GenerateUnitTestErrorLogger("assertFunctionParsing", q);
  const v3Relation = ir.GetRelationDef("v3") as DerivedRelation;
  const v3Where = (v3Relation.selection.compositeSelections[0].relation.whereClause as ExprFunAst);
  if (v3Where.functionType !== FunctionType.BuiltIn) {
    logger(`Didn't parse the function properly,  Got: ${JSON.stringify(v3Where, null, 2)}`);
  }
  return true;
}