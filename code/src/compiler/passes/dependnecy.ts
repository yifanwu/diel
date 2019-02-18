import { DielIr } from "../../lib";
import { getSelectionUnitDep, getTopologicalOrder, DependencyTree } from "./passesHelper";
import { DielAst } from "../../parser/dielAstTypes";

export function ApplyDependencies(ir: DielIr) {
  // first build the tree
  let depTree: DependencyTree = new Map<string, {dependsOn: string[], isDependentOn: string[]}>();
  ir.ApplyToAllSelectionUnits<void>((s, optional) => {
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

  const inputDependency = new Map<string, string[]>();
  ir.GetInputs().map(i => {
    const allDependencies = new Set<string>();
    oneStep(i.name, allDependencies);
    // filter out the outputs
    const inputDependencyValues: string[] = [];
    allDependencies.forEach(d => {
      if (ir.GetOutputs().map(o => o.name === d)) {
        inputDependencyValues.push(d);
      }
    });
    inputDependency.set(i.name, inputDependencyValues);
  });
  return inputDependency;
}
