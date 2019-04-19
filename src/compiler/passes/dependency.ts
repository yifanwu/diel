import { getSelectionUnitDep, getTopologicalOrder } from "./passesHelper";
import { RelationType, DerivedRelation, RelationIdType, CompositeSelection } from "../../parser/dielAstTypes";
import { SetIntersection } from "../../util/dielUtils";
import { GetAllDerivedViews, DielIr } from "../DielIr";
import { DependencyTree } from "../../runtime/runtimeTypes";
import { SqlDerivedRelation } from "../../parser/sqlAstTypes";

export function AddDependency(depTree: DependencyTree, selection: CompositeSelection, rName: string) {
  // first add dependency one way, then the other way
  const dependsOn = addDependencyOneWay(depTree, selection, rName);
  addDependencyOtherWay(depTree, dependsOn, rName);
}

// incremental dep tree building
function addDependencyOneWay(depTree: DependencyTree, selection: CompositeSelection, rName: string) {
  let dependsOn: string[] = [];
  selection.map(c => {
    const deps = getSelectionUnitDep(c.relation);
    dependsOn = deps.concat(dependsOn);
  });
  depTree.set(rName, {
    dependsOn,
    isDependedBy: []
  });
  return dependsOn;
}

function addDependencyOtherWay(depTree: DependencyTree, dependsOn: RelationIdType[], viewName: RelationIdType) {
  dependsOn.map(dO => {
    if (dO) { // avoid the case when its null
      // it's possible that these don't exist, if they are the leaves
      if (!depTree.has(dO)) {
        depTree.set(dO, {dependsOn: [], isDependedBy: []});
      }
      depTree.get(dO).isDependedBy.push(viewName);
    }
  });
}

// FIXME: clean up relative the function below
export function GetDependenciesFromSqlViewList(views: SqlDerivedRelation[]) {
  const depTree: DependencyTree = new Map<string, {dependsOn: string[], isDependedBy: string[]}>();
  views.map(v => AddDependency(depTree, v.selection, v.rName));
  return depTree;
}

export function GetDependenciesFromViewList(views: DerivedRelation[]) {
  const depTree: DependencyTree = new Map<string, {dependsOn: string[], isDependedBy: string[]}>();
  // add one direction
  views.map(v => AddDependency(depTree, v.selection.compositeSelections, v.rName));
  return depTree;
}

export function ApplyDependencies(ir: DielIr) {
  let depTree = GetDependenciesFromViewList(GetAllDerivedViews(ir.ast));

  const topologicalOrder = getTopologicalOrder(depTree);
  const {inputDependenciesOutput, inputDependenciesAll} = generateDependenciesByInput(depTree, ir);
  ir.dependencies = {
    depTree,
    topologicalOrder,
    inputDependenciesOutput, // RYAN & CACHING
    inputDependenciesAll
  };
}

// this is sort of a transitive closure step
function generateDependenciesByInput(depTree: DependencyTree, ir: DielIr) {
  const inputDependenciesOutput = new Map<string, Set<string>>();
  const inputDependenciesAll = new Map<string, Set<string>>();
  const outputSet = new Set(ir.GetAllDerivedViews().filter(v => v.relationType === RelationType.Output).map(o => o.rName));
  ir.GetEventRelationNames().map(i => {
    const allDependencies = generateDependenciesByName(depTree, i);
    const inputDependencyValues = SetIntersection<string>(allDependencies, outputSet);
    inputDependenciesOutput.set(i, inputDependencyValues);
    inputDependenciesAll.set(i, allDependencies);
  });
  return {
    inputDependenciesOutput,
    inputDependenciesAll
  };
}

/**
 * return the set of the relations that depent on the table passed in
 * TODO add depndsOn?: true and do another pass that uses transitive closure to figure out all dependnecies
 * @param depTree
 * @param rName
 * @param depndsOn the boolean is defaulted to true, if it's false, it's the other direction.
 */
export function generateDependenciesByName(depTree: DependencyTree, rName: string): Set<string> {
  const allDependencies = new Set<string>();
  oneStep(rName, allDependencies);
  // recursively checks for dependencies
  function oneStep(rName: string, affectedRelations: Set<string>) {
    // search through dependency
    let oldSet = new Set(affectedRelations);
    for (let [key, value] of depTree) {
      const found = value.dependsOn.filter(d => d === rName);
      if (found.length > 0) {
        affectedRelations.add(key);
      }
    }
    // set difference
    const diff = new Set([...affectedRelations].filter(x => !oldSet.has(x)));
    if (diff.size > 0) {
      // need to run this on more dependencies
      diff.forEach((v) => {
        oneStep(v, affectedRelations);
      });
    }
    return affectedRelations;
  }
  return allDependencies;
}

/**
 * Get the set of relations that the view depends on
 * needs to iterate until we hit the original tables
 * @param viewName
 * @param depTree
 */
export function GetOriginalRelationsAViewDependsOn(viewName: string, depTree: DependencyTree): Set<string> {

  let dep = depTree.get(viewName);
  let tables = new Set<string> ();
  if (dep && dep.dependsOn.length > 0) {
    // breadth first
    let toVisit = dep.dependsOn.slice();
    let visited = [viewName] as string[];
    let next: string;

     while (toVisit.length > 0) {
      next = toVisit.shift();
      if (depTree.get(next).dependsOn.length === 0) {
        tables.add(next);
        visited.push(next);
        continue;
      }
      let children = depTree.get(next).dependsOn;
      children.forEach(child => {
        if (toVisit.indexOf(next) === -1 && visited.indexOf(next) === -1) {
          toVisit.push(child);
        }
      });
      visited.push(next);
    }
  }
  return tables;
}