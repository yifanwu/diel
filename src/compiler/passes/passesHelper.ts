import { LogInternalError, DielInternalErrorType } from "../../util/messages";
import { DependencyTree } from "../../runtime/runtimeTypes";
import { RelationNameType } from "../../parser/dielAstTypes";
import { SqlRelationType, SqlRelation } from "../../parser/sqlAstTypes";

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
    if ((idx > -1) && visitedArray[idx].visited) {
      return;
    }
    // ugh of vs in
    const node = depTree.get(relation);
    if (node) {
      for (let d of node.dependsOn) {
        topoVisit(d);
      }
    }
    if (idx > -1) {
      if (topoSorted.find(t => t === relation)) {
        LogInternalError(`Shouldn't be added again, ${relation}`);
      }
      visitedArray[idx].visited = true;
      topoSorted.push(relation);
    }
  }
  // there are no dangling leaves; they will just have no dependencies
  return topoSorted;
}



/**
 * take in dependency tree and a relation definition lookup function
 *          o1
 *         /
 * t1 -> v1 - o2
 * @param ast
 */
export function getRelationsToMateralize(depTree: DependencyTree, getRelationDef: (rName: RelationNameType) => SqlRelation | undefined ): string[] {
  let toMAterialize: RelationNameType[] = [];
  depTree.forEach((nodeDep, relationName) => {
    const rDef = getRelationDef(relationName);
    if (rDef && (rDef.relationType === SqlRelationType.View)) {
       // and if the view is dependent on by at least two views/outputs, mark it as to materialize
       if (nodeDep.isDependedBy.length > 1) {
        toMAterialize.push(relationName);
       }
     }
  });
  return toMAterialize;
}
