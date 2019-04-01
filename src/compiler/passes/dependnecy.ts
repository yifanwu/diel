import { getSelectionUnitDep, getTopologicalOrder, DependencyTree } from "./passesHelper";
import { RelationType, DerivedRelation } from "../../parser/dielAstTypes";
import { SetIntersection } from "../../util/dielUtils";
import { GetAllDerivedViews, DielIr } from "../DielIr";
import { LogInternalError } from "../../util/messages";

export function GetDependenciesFromViewList(views: DerivedRelation[]) {
  const depTree: DependencyTree = new Map<string, {dependsOn: string[], isDependedBy: string[]}>();
  views.map(v => {
    let dependsOn: string[] = [];
    v.selection.compositeSelections.map(c => {
      const deps = getSelectionUnitDep(c.relation);
      dependsOn = deps.concat(dependsOn);
    });
    if (!v.name) {
      LogInternalError(`Relation should be named`);
    }
    if (v.name === "{sourceRelation}") {
      debugger;
    }
    depTree.set(v.name, {
      dependsOn,
      isDependedBy: []
    });
  });
  depTree.forEach((value, key) => {
    value.dependsOn.map(dO => {
      if (dO) { // avoid the case when its null
        // it's possible that these don't exist, if they are the leaves
        if (!depTree.has(dO)) {
          if (dO === "{sourceRelation}") {
            debugger;
          }
          depTree.set(dO, {dependsOn: [], isDependedBy: []});
        }
        depTree.get(dO).isDependedBy.push(key);
      }
    });
  });
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
  const outputSet = new Set(ir.GetAllDerivedViews().filter(v => v.relationType === RelationType.Output).map(o => o.name));
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