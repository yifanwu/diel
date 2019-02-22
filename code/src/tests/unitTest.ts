import { DependencyTree, getTopologicalOrder } from "../compiler/passes/passesHelper";

export function testTopologicalSort() {
  const depTree: DependencyTree = new Map([
    ["v1", {
      dependsOn: ["v2"],
      isDependentOn: []
    }],
    ["v2", {
      dependsOn: ["v3"],
      isDependentOn: []
    }],
    ["v3", {
      dependsOn: ["v4"],
      isDependentOn: []
    }],
    ["v4", {
      dependsOn: [],
      isDependentOn: []
    }],
  ]);
  const sorted = getTopologicalOrder(depTree);
  console.log("sorted", sorted);
  if (sorted[0] !== "v4" || sorted[1] !== "v3" || sorted[2] !== "v2" || sorted[3] !== "v1") {
    throw new Error(`testTopologicalSort failed`);
  }
}

export function testDependencyGraph() {
  // TODO
  // maybe sahana?
}