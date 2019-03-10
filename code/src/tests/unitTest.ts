import { DependencyTree, getTopologicalOrder, NodeDependencyAugmented } from "../compiler/passes/passesHelper";
import { RelationId, LocalDbId, DbIdType } from "../compiler/DielPhysicalExecution";
import { SingleDistribution, QueryDistributionRecursiveEval } from "../compiler/passes/distributeQueries";
import { RelationType } from "../parser/dielAstTypes";

export function testTopologicalSort() {
  const depTree: DependencyTree = new Map([
    ["v1", {
      dependsOn: ["v2"],
      isDependedBy: []
    }],
    ["v2", {
      dependsOn: ["v3"],
      isDependedBy: ["v1"]
    }],
    ["v3", {
      dependsOn: ["v4"],
      isDependedBy: ["v2"]
    }],
    ["v4", {
      dependsOn: [],
      isDependedBy: ["v3"]
    }],
  ]);
  const sorted = getTopologicalOrder(depTree);
  console.log("sorted", sorted);
  if (sorted[0] !== "v4" || sorted[1] !== "v3" || sorted[2] !== "v2" || sorted[3] !== "v1") {
    throw new Error(`testTopologicalSort failed`);
  }
}

export function testDistributionLogc() {
  // set up
  const augmentedDep = new Map<RelationId, NodeDependencyAugmented>();
  const depI1: NodeDependencyAugmented = {
    relationName: "i1",
    remoteId: LocalDbId,
    relationType: RelationType.EventTable,
    dependsOn: [],
    isDependedBy: ["v1"]
  };
  const depI2: NodeDependencyAugmented = {
    relationName: "i2",
    remoteId: LocalDbId,
    relationType: RelationType.EventTable,
    dependsOn: [],
    isDependedBy: ["v1"]
  };
  const depR1: NodeDependencyAugmented = {
    relationName: "r1",
    remoteId: 2,
    relationType: RelationType.ExistingAndImmutable,
    dependsOn: [],
    isDependedBy: ["v1"]
  };
  const depV1: NodeDependencyAugmented = {
    relationName: "v1",
    relationType: RelationType.EventView,
    dependsOn: ["i1", "i2", "r1"],
    isDependedBy: ["o1"]
  };
  const depO1: NodeDependencyAugmented = {
    relationName: "o1",
    relationType: RelationType.Output,
    dependsOn: ["i1", "i2", "r1"],
    isDependedBy: []
  };
  augmentedDep.set("i1", depI1);
  augmentedDep.set("i2", depI2);
  augmentedDep.set("r1", depR1);
  augmentedDep.set("v1", depV1);
  augmentedDep.set("o1", depO1);

  // as a simple hack for testing, encode the remoteId by the size of the original Id
  function selectRelationEvalOwner (dbIds: Set<DbIdType>): DbIdType {
    return Math.max(...Array.from(dbIds));
  }
  const distributions: SingleDistribution[] = [];
  QueryDistributionRecursiveEval(distributions, {
    augmentedDep,
    selectRelationEvalOwner
  }, "o1");
  // DO assertions
  console.log(`Dependencies: ${JSON.stringify(distributions, null, 2)}`);
}

export function testDependencyGraph() {
  // TODO
  // maybe sahana?
}