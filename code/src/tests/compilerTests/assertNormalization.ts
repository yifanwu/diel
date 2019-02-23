import { GenerateUnitTestErrorLogger } from "../../lib/messages";
import { ExprColumnAst } from "../../parser/exprAstTypes";
import { DielIr } from "../../lib";

export function assertBasicNormalizationOfRelation(ir: DielIr, q: string) {
  const logger = GenerateUnitTestErrorLogger("assertBasicNormalizationOfRelation", q);
  const v1Relation = ir.allCompositeSelections.get("v1");
  const aSelection = v1Relation[0].relation.derivedColumnSelections[0].expr as ExprColumnAst;
  if (aSelection.relationName !== "t1") {
    logger(`Normalization pass failed, I had expected a to be matched with relation t1. Got: ${JSON.stringify(aSelection, null, 2)}`);
  }

  // the following are known bugs, currently not implemented.

  // const v2Relation = ir.allDerivedRelations.get("v2");
  // // make sure that the subquery is at least properly derived
  // const v2Subquery = v2Relation[0].relation.joinClauses[0].relation.subquery.compositeSelections[0].relation;
  // if (!v2Subquery.derivedColumnSelections) {
  //   logger(`Normalization pass failed to normalize subquery, didn't perform the act. Got: ${JSON.stringify(v2Subquery, null, 2)}`);
  // }

  // const v2bSelection = v2Subquery.derivedColumnSelections[0].expr as ExprColumnAst;
  // if (v2bSelection.relationName !== "t2") {
  //   logger(`Normalization pass failed to find t2 for subquery`);
  // }
  return true;
}