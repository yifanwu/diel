import { DielAst, RelationReference, RelationReferenceType, RelationReferenceDirect, SelectionUnit, ExprAst, ExprType, ExprColumnAst, ExprFunAst, ExprValAst, DerivedRelation } from "../../parser/dielAstTypes";
import { ReportDielUserError, ReportDielUserWarning, LogInternalError, DielInternalErrorType } from "../../util/messages";
import { WalkThroughRelationReferences, WalkThroughSelectionUnits } from "../DielAstVisitors";

function relationReferenceVisitor(r: RelationReference) {
  if (r.alias) return;
  switch (r.relationReferenceType) {
    case RelationReferenceType.Subquery:
      ReportDielUserError(`Subqueries must be named!`);
      return;
    case RelationReferenceType.Direct:
      r.alias = (r as RelationReferenceDirect).relationName;
  }
}

function visitSelections (r: SelectionUnit) {
  r.columnSelections.map(c => {
    if (c.alias) return;
    c.alias = getAliasForExpr(c.expr);
  });
}

export function NormalizeAliasForDerivedRelation(derived: DerivedRelation) {
  derived.selection.compositeSelections.map(c => {
    visitSelections(c.relation);
    if (c.relation.baseRelation) {
      relationReferenceVisitor(c.relation.baseRelation);
      if (c.relation.joinClauses) {
        c.relation.joinClauses.map(j => {
          relationReferenceVisitor(j.relation);
        });
      }
    }
  });
}

/**
 * Need to normalize the names for the relation references
 * also for column names
 * @param ast
 */
export function NormalizeAlias(ast: DielAst) {
  // walk through all the Relation References
  WalkThroughRelationReferences<void>(ast, relationReferenceVisitor);
  WalkThroughSelectionUnits<void>(ast, visitSelections);
  return;
}

function getAliasForExpr(expr: ExprAst): string | null {
  switch (expr.exprType) {
    case ExprType.Column:
      return (expr as ExprColumnAst).columnName;
    case ExprType.Func:
      ReportDielUserWarning(`Should name func column!`);
      return (expr as ExprFunAst).functionReference;
    case ExprType.Val:
      ReportDielUserWarning(`Should name value column!`);
      const v = (expr as ExprValAst);
      return v.dataType + v.value;
    case ExprType.Star:
      return null;
    default:
      return LogInternalError(`Not all ${expr.exprType} handled`, DielInternalErrorType.UnionTypeNotAllHandled);
  }
}