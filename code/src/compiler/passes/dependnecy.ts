import { DielIr } from "../../lib";
import { getSelectionUnitDep, getTopologicalOrder, DependencyTree } from "./passesHelper";
import { DielAst, RelationType } from "../../parser/dielAstTypes";
import { SetIntersection } from "../../lib/dielUtils";

export function ApplyDependencies(ir: DielIr) {
  // first build the tree
  let depTree: DependencyTree = new Map<string, {dependsOn: string[], isDependentOn: string[]}>();
  ir.ApplyToImmediateSelectionUnits<void>((s, optional) => {
    const rName = optional.relationName;
    if (!rName) {
      throw new Error(`relation name must be defined`);
    }
    const deps = getSelectionUnitDep(s);
    let dependsOn: string[];
    if (depTree.has(rName)) {
      const existingDep = depTree.get(rName);
      dependsOn = deps.concat(existingDep.dependsOn);
    } else {
      dependsOn = deps;
    }
    depTree.set(rName, {
      dependsOn,
      isDependentOn: null
    });
  });
  // TODO need to do another pass to set the isDependentOn
  // we need to do another pass where we look up the other direction and populate it...
  // sahana?
  const topologicalOrder = getTopologicalOrder(depTree);
  const {inputDependenciesOutput, inputDependenciesAll} = generateDependenciesByInput(depTree, ir);
  ir.dependencies = {
    depTree,
    topologicalOrder,
    inputDependenciesOutput,
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
  const outputSet = new Set(ir.GetAllViews().filter(v => v.relationType === RelationType.Output).map(o => o.name));
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
 * TODO add depndsOn?: true and do another pass that uses transitive closure to figure out all dependnecies
 * @param depTree
 * @param rName
 * @param depndsOn the boolean is defaulted to true, if it's false, it's the other direction.
 */
export function generateDependenciesByName(depTree: DependencyTree, rName: string) {
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