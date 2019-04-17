import { getSelectionUnitDep, getTopologicalOrder } from "./passesHelper";
import { RelationType, DerivedRelation, RelationIdType } from "../../parser/dielAstTypes";
import { SetIntersection } from "../../util/dielUtils";
import { GetAllDerivedViews, DielIr } from "../DielIr";
import { LogInternalError } from "../../util/messages";
import { DependencyTree } from "../../runtime/runtimeTypes";

export function AddDependency(depTree: DependencyTree, view: DerivedRelation) {
  // first add dependency one way, then the other way
  const dependsOn = addDependencyOneWay(depTree, view);
  addDependencyOtherWay(depTree, dependsOn, view.rName);
}

// incremental dep tree building
function addDependencyOneWay(depTree: DependencyTree, view: DerivedRelation) {
  let dependsOn: string[] = [];
  view.selection.compositeSelections.map(c => {
    const deps = getSelectionUnitDep(c.relation);
    dependsOn = deps.concat(dependsOn);
  });
  if (!view.rName) {
    LogInternalError(`Relation should be named`);
  }
  depTree.set(view.rName, {
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

export function GetDependenciesFromViewList(views: DerivedRelation[]) {
  const depTree: DependencyTree = new Map<string, {dependsOn: string[], isDependedBy: string[]}>();
  // add one direction
  views.map(v => AddDependency(depTree, v));
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


export function getOriginalRelationsDependedOn(view: DerivedRelation, depTree: DependencyTree,
  originalRelations: string[]): Set<string> {

   let dep = depTree.get(view.rName);
  let tables = new Set<string> ();
  if (dep && dep.dependsOn.length > 0) {
    // breadth first
    let toVisit = dep.dependsOn.slice(); // clone
    let visited = [view.rName] as string[];
    let next: string;

     while (toVisit.length > 0) {
      next = toVisit.shift();
      if (originalRelations.indexOf(next) !== -1) {
        tables.add(next);
        visited.push(next); // not necessary
        continue;
      }
      let children = depTree.get(next).dependsOn;
      children.forEach(child => {
        if (toVisit.indexOf(next) === -1 && visited.indexOf(next) === -1) {
          toVisit.push(child);
        }
      });
      visited.push(next); // not necessary
    }
  }
  return tables;
}