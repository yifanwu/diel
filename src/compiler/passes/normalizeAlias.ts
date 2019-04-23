import { DielAst, RelationReference, RelationReferenceType, RelationReferenceDirect } from "../../parser/dielAstTypes";
import { ReportDielUserError } from "../../util/messages";
import { WalkThroughRelationReferences } from "../DielAstVisitors";

/**
 * Need to normalize the names for the relation references
 * FIXME: not sure if we need for column names?
 * @param ast
 */
export function NormalizeAlias(ast: DielAst) {
  // walk through all the Relation References
  const visitor = (r: RelationReference) => {
    if (r.alias) return;
    switch (r.relationReferenceType) {
      case RelationReferenceType.Subquery:
        ReportDielUserError(`Subqueries must be named!`);
        return;
      case RelationReferenceType.Direct:
        r.alias = (r as RelationReferenceDirect).relationName;
    }
  };
  WalkThroughRelationReferences<void>(ast, visitor);
  return;
}