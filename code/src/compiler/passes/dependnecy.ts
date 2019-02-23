import { DielIr } from "../../lib";
import { getSelectionUnitDep, getTopologicalOrder, DependencyTree } from "./passesHelper";
import { DielAst } from "../../parser/dielAstTypes";
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
  const inputDependencies = generateDependenciesByInput(depTree, ir);
  ir.dependencies = {
    depTree,
    topologicalOrder,
    inputDependencies
  };
}

// this is sort of a transitive closure step
function generateDependenciesByInput(depTree: DependencyTree, ir: DielIr) {
  const inputDependency = new Map<string, Set<string>>();
  ir.GetInputs().map(i => {
    // filter out the outputs
    // const inputDependencyValues: string[] = [];
    const allDependencies = generateDependenciesByName(depTree, i.name);
    const outputSet = new Set(ir.GetAllViews().map(o => o.name));
    const inputDependencyValues = SetIntersection<string>(allDependencies, outputSet);
    inputDependency.set(i.name, inputDependencyValues);
  });
  return inputDependency;
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
      if (value.dependsOn.filter(d => d === rName)) {
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