import { DielAst, OriginalRelation, UdfType, ProgramsIr, DerivedRelation, RelationType, createEmptyDielAst, Relation } from "../parser/dielAstTypes";
import { DbType } from "../runtime/runtimeTypes";
import { DielIr } from "../lib";
import { PhysicalMetaData } from "../runtime/DielRuntime";
import { generateDependenciesByName } from "./passes/dependnecy";
import { DeepCopy, SetIntersection } from "../lib/dielUtils";
import { findOutputDep, getStaticTableFromDerived, generateShipWorkerInputClause, isRelationTypeDerived, SingleDistribution } from "./passes/distributeQueries";
import { LogInternalError } from "../lib/messages";
import { getSelectionUnitAnnotation } from "../runtime/annotations";
import { DependencyTree, NodeDependencyAugmented } from "./passes/passesHelper";
import { NodeDependency } from "../runtime/Remote";

/**
 * currently include
 * - views for local/workers/remotes
 * - programs for shipping data
 *
 * ASSUMPTIONs:
 * - this is done before caching and materialization
 * - only distributed to one remote
 *
 * future:
 * - indices
 * - caching
 */

export type DbIdType = number;
export type RelationId = string;

export type JobPerTick = {
  viewToShip: RelationId,
  viewsToGet: Set<RelationId>,
  dependentOutput: Set<RelationId>,
  destination: DbIdType
};

// HARDCODED
export const LocalDbId = 1;

interface RemoteExecutionSpec {
  ast: DielAst;
  jobs: JobPerTick[];
}

/**
 * Note that ir and metaData are read only
 *   putting the reference in the class for easier access.
 */
export class DielPhysicalExecution {
  ir: DielIr; // read only
  metaData: PhysicalMetaData; // read only
  dbExecutionSpecs: Map<DbIdType, RemoteExecutionSpec>;
  runtimeOutputNames: Set<RelationId>;
  // local: DielAst;
  // maps inputNames to remote destinations
  // localToRemotes: Map<string, Set<DbIdType>>;
  // this is to trigger evaluations of static event views
  // FIXME: might need refactoring
  // staticEventViews: {
  //   dependentOutputs: Set<string>;
  //   viewName: string;
  //   remoteId: DbIdType
  // }[];

  constructor(ir: DielIr, metaData: PhysicalMetaData) {
    this.ir = ir;
    this.metaData = metaData;
    // get all the outputs and loop
    const augmentedDep = this.augmentDepTree(this.ir.dependencies.depTree);
    // let's first figure out the shipping information
    const distributions = this.distributedEval(augmentedDep);
    this.dbExecutionSpecs = this.getExecutionSpecsFromDistribution(distributions);

    // then construct the definitions

  }

  /**
   * This one finalizes the outputs so that it knows what static inputs to ship over initially.
   * TODO: Add output
   */
  public AddRuntimeOutput(outputName: string) {
    // check if this is static
    // actually add to the views to ship
    this.runtimeOutputNames.add(outputName);
  }

  getExecutionSpecsFromDistribution(distributions: SingleDistribution[]): Map<DbIdType, RemoteExecutionSpec> {
    return new Map();
  }

  /**
   * recursive function to evaluate what view needs to be where
   */
  distributedEval(augmentedDep: Map<string, NodeDependencyAugmented>) {
    const outputNodes = this.ir.GetOutputs().map(o => augmentedDep.get(o.name));
    const distributions: any[] = [];
    outputNodes.map(output => {
      if (output.relationType !== RelationType.Output) {
        LogInternalError(`DistributedEval must be called on outputs, but you called on ${output}`);
      }
    });
    return distributions;
  }

  getShippingInformationForInput(inputName: RelationId): Set<DbIdType> {
    return new Set(this.dbExecutionSpecs.get(LocalDbId).jobs
      .filter(j => (j.viewsToGet.has(inputName) && SetIntersection(this.runtimeOutputNames, j.dependentOutput).size > 0))
      .map(j => j.destination));
  }

  getLocalDbAst() {
    return this.getAstFromDbId(LocalDbId);
  }

  getAstFromDbId(dbId: DbIdType) {
    return this.dbExecutionSpecs.get(dbId).ast;
  }

  /**
   * adding where the location is, as well as the type of location it is.
   */
  augmentDepTree(depTree: DependencyTree) {
    const augmentedTree = new Map<string, NodeDependencyAugmented>();
    depTree.forEach((nodDep, relationName) => {
      const remoteId = this.getDbIdByRelationName(relationName);
      const relationType = this.ir.GetRelationDef(relationName).relationType;
      const nodeDepAugmetned: NodeDependencyAugmented = {
        remoteId,
        relationName,
        relationType,
        ...Object.assign({}, nodDep),
      };
      augmentedTree.set(relationName, nodeDepAugmetned);
    });
    return augmentedTree;
  }
  // this function needs to access the metadata
  selectRelationEvalOwner(dbIds: Set<DbIdType>): DbIdType {
    // right now just pick a socket if it's there
    // need to look up its information
    let workerId = null;
    dbIds.forEach(dbId => {
      const dbType = this.metaData.dbs.get(dbId).dbType;
      switch (dbType) {
        case DbType.Socket: {
          return dbId;
        }
        case DbType.Worker: {
          workerId = dbId;
        }
      }
    });
    if (workerId) {
      return workerId;
    }
    return LocalDbId;
  }

  getRemoteInfoById(remoteId: DbIdType) {
    return this.dbExecutionSpecs.get(remoteId);
  }

  getDbIdByRelationName(rName: string): DbIdType {
    // look up metadata
    const r = this.metaData.relationLocation.get(rName);
    if (r) {
      return r.dbId;
    } else {
      LogInternalError(`Cannot find relation ${rName}`);
    }
  }
}