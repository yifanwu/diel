import { GenerateUnitTestErrorLogger } from "../../lib/messages";
import { getDielIr } from "../../lib/cli-compiler";
import { ExprColumnAst } from "../../parser/exprAstTypes";

export function assertBasicNormalizationOfRelation() {

  let q = `
  create input t1 (
    a int,
    b int
  );
  create input t2 (
    c text,
    b int
  );

  create view v1 as select a from t1 join t2 on t1.b = t2.b where c = 'cat';
  `;
  const logger = GenerateUnitTestErrorLogger("assertBasicNormalizationOfRelation", q);
  let ir = getDielIr(q);
  const v1Relation = ir.allDerivedRelations.get("v1");
  const aSelection = v1Relation[0].relation.derivedColumnSelections[0].expr as ExprColumnAst;
  if (aSelection.relationName !== "t1") {
    logger(`Normalization pass failed, I had expected a to be matched with relation t1`);
  }
  return true;
}