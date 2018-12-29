import { SelectionUnit, RelationReference, Column } from "../../parser/sqlAstTypes";
import { ExprType, ExprRelationAst } from "../../parser/exprAstTypes";
import { DerivedRelation } from "../../parser/dielAstTypes";


export type DependencyTree = Map<string, {
  dependsOn: string[],
  isDependentOn: string[]
}>;

export interface DependencyInfo {
  // both ways for easy access
  depTree: DependencyTree;
  topologicalOrder: string[];
}

function getRelationReferenceDep(r: RelationReference): string[] {
  if (r.relationName) {
    return [r.relationName];
  } else {
    // subquery!
    return r.subquery.compositeSelections.reduce((acc, c) => acc.concat(getSelectionUnitDep(c.relation)), []);
  }
}

// recursive!
export function getSelectionUnitDep(s: SelectionUnit): string[] {
  let deps = getRelationReferenceDep(s.baseRelation);
  // the predicates on joins might have dependencies too... #FIXMELATER
  s.joinClauses.map(j => {
    deps = deps.concat(getRelationReferenceDep(j.relation));
  });
  if (s.whereClause.exprType === ExprType.Relation) {
    const relationExpr = s.whereClause as ExprRelationAst;
    deps = deps.concat(relationExpr.selection.compositeSelections.reduce((acc, c) => acc.concat(getSelectionUnitDep(c.relation)), []));
  }
  return deps;
}


export function getTopologicalOrder(depTree: DependencyTree) {
  // lots of redundancy for access
  // this code is so dumb
  let visitedStringToNumber = new Map<string, number>();
  let visitedArray: { visited: boolean, relationName: string }[] = [];
  let i = 0;
  for (let key of depTree.keys()) {
    visitedStringToNumber.set(key, i);
    i += 1;
    visitedArray.push({visited: false, relationName: key});
  }
  let hasUnmarked = visitedArray.filter(v => !v.visited);
  while (hasUnmarked.length > 0) {
    topoVisit(hasUnmarked[0].relationName);
  }
  let sorted: string[] = [];
  function topoVisit(relation: string) {
    if (visitedArray[visitedStringToNumber.get(relation)].visited) {
      return;
    }
    for (let d in depTree.get(relation).dependsOn) {
      topoVisit(d);
    }
    visitedArray[visitedStringToNumber.get(relation)].visited = true;
    sorted.push(relation);
  }
  return sorted;
}
function checkColumnFoundForType(columnFound: Column[]) {

}