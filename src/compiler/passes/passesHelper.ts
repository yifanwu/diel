import { LogInternalError, DielInternalErrorType } from "../../util/messages";
import { DependencyTree } from "../../runtime/runtimeTypes";
import { RelationReference, RelationReferenceType, RelationReferenceDirect, RelationReferenceSubquery } from "../../parser/dielAstTypes";

/**
 * If there is a subquery, then use alias, otherwise use the original relation name
 * @param r relation reference
 */
export function GetRelationReferenceName(r: RelationReference): string | null {
  switch (r.relationReferenceType) {
    case RelationReferenceType.Direct:
      return (r as RelationReferenceDirect).relationName;
    case RelationReferenceType.Subquery:
      return (r as RelationReferenceSubquery).alias;
    default:
      return LogInternalError(``, DielInternalErrorType.UnionTypeNotAllHandled);
  }
}


export function getTopologicalOrder(depTree: DependencyTree) {
  // lots of redundancy for access
  // this code is so dumb
  let visitedStringToNumber = new Map<string, number>();
  let visitedArray: { visited: boolean, relationName: string }[] = [];
  let topoSorted: string[] = [];
  let i = 0;
  for (let key of depTree.keys()) {
    visitedStringToNumber.set(key, i);
    i += 1;
    visitedArray.push({visited: false, relationName: key});
  }
  let hasUnmarked = visitedArray.filter(v => !v.visited);
  let loopCount = 1;
  while (hasUnmarked.length > 0) {
    topoVisit(hasUnmarked[0].relationName);
    hasUnmarked = visitedArray.filter(v => !v.visited);
    loopCount += 1;
    if (loopCount > 1000) { // this is brittle, and temporarily for debugging #FIXME
      LogInternalError(`Too many loops in toplogical sort`);
    }
  }
  function topoVisit(relation: string) {
    loopCount += 1;
    if (loopCount > 1000) { // this is brittle, and temporarily for debugging #FIXME
      debugger;
      LogInternalError(`Too many loops in toplogical sort`);
    }
    if (!visitedStringToNumber.has(relation)) {
      // this should be the case where a static relation is referred
      // in which case we can just skip; enhance later #FIXMELATER
      return;
    }
    const idx = visitedStringToNumber.get(relation);
    if (idx && visitedArray[idx].visited) {
      return;
    }
    // ugh of vs in
    const node = depTree.get(relation);
    if (node) {
      for (let d of node.dependsOn) {
        topoVisit(d);
      }
    }
    if (idx) {
      visitedArray[idx].visited = true;
      topoSorted.push(relation);
    }
  }
  // there are no dangling leaves; they will just have no dependencies
  return topoSorted;
}