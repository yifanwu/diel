import { DependencyTree, getTopologicalOrder, NodeDependencyAugmented } from "../compiler/passes/passesHelper";
import { RelationIdType, LocalDbId, DbIdType } from "../compiler/DielPhysicalExecution";
import { SingleDistribution, QueryDistributionRecursiveEval } from "../compiler/passes/distributeQueries";
import { RelationType } from "../parser/dielAstTypes";
import { BgGreen, Reset } from "../util/messages";

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
  const augmentedDep = new Map<RelationIdType, NodeDependencyAugmented>();
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
  const scope = {
    augmentedDep,
    selectRelationEvalOwner,
    outputName: "dummy"
  };
  QueryDistributionRecursiveEval(distributions, scope, "o1");
  const expected = [
    {
      relationName: "i1",
      from: 1,
      to: 1
    },
    {
      relationName: "i2",
      from: 1,
      to: 1
    },
    {
      relationName: "r1",
      from: 2,
      to: 2
    },
    {
      relationName: "i1",
      from: 1,
      to: 2
    },
    {
      relationName: "i2",
      from: 1,
      to: 2
    },
    {
      relationName: "r1",
      from: 2,
      to: 2
    }
  ];
  // DO assertions
  if (expected.length !== distributions.length) {
    throw new Error(`Distribution incorrect length, expected ${JSON.stringify(expected, null, 2)}, but got ${JSON.stringify(distributions, null, 2)}`);
  }
  expected.map(e => {
    const f = distributions.find(d => (e.relationName === d.relationName) && (e.to === d.to));
    if (!f || f.from !== e.from) {
      throw new Error(`Distribution incorrect! Expected to find ${JSON.stringify(e, null, 2)}`);
    }
  });
  console.log(`${BgGreen}Passed testDistributionLogc!${Reset}`);
}

export function testDistributionLogcComplex() {
  // TODO
}

export function testDependencyGraph() {
  // TODO
  // maybe sahana?
}