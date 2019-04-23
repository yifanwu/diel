import { LogInternalError, DielInternalErrorType } from "../../util/messages";
import { DependencyTree } from "../../runtime/runtimeTypes";

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