import { DielAst, DerivedRelation, CrossFilterIr, RelationType } from "../../parser/dielAstTypes";
import { SetOperator, SelectionUnit, RelationSelection, AstType } from "../../parser/sqlAstTypes";

/**
 * Notes:
 * - We are assuming that crossfitlers do not have unions
 * @param ast DielAst
 */
export function applyCrossfilter(ast: DielAst): void {
  const newSetsOfViews = ast.crossfilters.map(c => _getViews(c));
  ast.views = ast.views.concat(...newSetsOfViews);
}

function _getViews(xIr: CrossFilterIr): DerivedRelation[] {
  // we need to create different views
  // first the static ones
  const unfilteredViews: DerivedRelation[] = xIr.charts.map(c => {
    return {
      relationType: RelationType.View,
      name: `${c.chartName}Unfiltered`,
      selection: c.selection
    };
  });
  const filteredViews: DerivedRelation[] = xIr.charts.map(c => {
    const otherCharts = xIr.charts.filter(c2 => c2.chartName !== c.chartName);
    const base = c.selection.compositeSelections[0].relation;
    // might not be the most performant.
    let relation = JSON.parse(JSON.stringify(base)) as SelectionUnit;
    relation.joinClauses = base.joinClauses.concat(otherCharts.map(o => o.predicate));
    const selection: RelationSelection = {
      astType: AstType.RelationSelection,
      compositeSelections: [{
        op: SetOperator.NA,
        relation
      }]
    };
    return {
      name: `${c.chartName}Filtered`,
      relationType: RelationType.View,
      selection
    };
  });
  // then the dynamic ones
  return unfilteredViews.concat(filteredViews);
}