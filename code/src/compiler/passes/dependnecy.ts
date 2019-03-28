import { DielIr } from "../../lib";
import { getSelectionUnitDep, getTopologicalOrder, DependencyTree } from "./passesHelper";
import { DielAst, RelationType, DerivedRelation, SelectionUnit } from "../../parser/dielAstTypes";
import { SetIntersection } from "../../lib/dielUtils";
import { SelectionUnitVisitorFunctionOptions, GetAllDerivedViews } from "../DielIr";
import { LogInternalError } from "../../lib/messages";

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
// function depTreeHelper(depTree: DependencyTree) {
//   return (s: SelectionUnit, optional: SelectionUnitVisitorFunctionOptions) => {
//     const rName = optional.relationName;
//     if (!rName) {
//       throw new Error(`relation name must be defined`);
//     }
//     const deps = getSelectionUnitDep(s);
//     let dependsOn: string[] = [];
//     if (depTree.has(rName)) {
//       const existingDep = depTree.get(rName);
//       dependsOn = deps.concat(existingDep.dependsOn);
//     } else {
//       dependsOn = deps;
//     }
//     depTree.set(rName, {
//       dependsOn,
//       isDependedBy: []
//     });
//   };
// }

// FIXME: replace this shitty implementation with the above and test
export function ApplyDependencies(ir: DielIr) {
  // first build the tree
  let depTree = GetDependenciesFromViewList(GetAllDerivedViews(ir.ast));
  // DependencyTree = new Map<string, {dependsOn: string[], isDependedBy: string[]}>();
  // const fun = depTreeHelper(depTree);
  // ir.ApplyToImmediateSelectionUnits<void>(fun);
  // // TODO: make the depends on a set as opposed to a string, easier to search.

  // // another pass to set the isDependentOn
  // depTree.forEach((value, key) => {
  //   value.dependsOn.map(dO => {
  //     // it's possible that these don't exist, if they are the leaves
  //     if (!depTree.has(dO)) {
  //       depTree.set(dO, {dependsOn: [], isDependedBy: []});
  //     }
  //     depTree.get(dO).isDependedBy.push(key);
  //   });
  // });
  // we need to do another pass where we look up the other direction and populate it...
  // sahana?
  const topologicalOrder = getTopologicalOrder(depTree);
  const {inputDependenciesOutput, inputDependenciesAll} = generateDependenciesByInput(depTree, ir);
  ir.dependencies = {
    depTree,
    topologicalOrder,
    inputDependenciesOutput, // RYAN & CACHING
    inputDependenciesAll
     // -> inputDependenciesOutput
    // inpiutDependenciesAll (which includes views)
  };
}

// export class DependencyInfo {
//   depTree: DependencyTree;
//   topologicalOrder: string[];
//   inputDependenciesOutput: Map<string, Set<string>>;
//   inputDependenciesAll: Map<string, Set<string>>;
//   constructor() {

//   }

// }

// function modifyDependencyWithNewInput() {

// }

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

/**
 * Return the original relations that the view depends on
 */
export function getOriginalRelationsDependedOn(view: DerivedRelation, depTree: DependencyTree, originalRelations: string[]): Set<string> {
  let dep = depTree.get(view.name);
  let tables = new Set<string> ();
  if (dep && dep.dependsOn.length > 0) {
    // breadth first
    let toVisit = dep.dependsOn.slice(); // clone
    let visited = [view.name] as string[];
    let next: string;
    while (toVisit.length > 0) {
      next = toVisit.pop();
      visited.push(next); // not necessary
      let children = depTree.get(next).dependsOn;
      children.forEach(child => {
        if (originalRelations.indexOf(child) !== -1) {
          tables.add(child);
        }
        else if (toVisit.indexOf(next) === -1 && visited.indexOf(next) === -1) {
          toVisit.push(child);
        }
      });

    }
  }
  return tables;
}