import { DielAst, DerivedRelation, RelationType, createEmptyDielAst } from "../parser/dielAstTypes";
import { DbType } from "../runtime/runtimeTypes";
import { DielIr } from "../lib";
import { PhysicalMetaData } from "../runtime/DielRuntime";
import { getEventTableFromDerived, SingleDistribution, QueryDistributionRecursiveEval } from "./passes/distributeQueries";
import { LogInternalError } from "../lib/messages";
import { DependencyTree, NodeDependencyAugmented } from "./passes/passesHelper";

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
export type RelationIdType = string;
export type LogicalTimestep = number;

export type JobPerInput = {
  viewToShip: RelationIdType,
  viewsToGet: Set<RelationIdType>,
  dependentOutput: Set<RelationIdType>,
  destinations: Set<DbIdType>
};

// HARDCODED
export const LocalDbId = 1;

/**
 * Note that ir and metaData are read only
 *   putting the reference in the class for easier access.
 */
export class DielPhysicalExecution {
  ir: DielIr; // read only
  metaData: PhysicalMetaData; // read only
  astSpecPerDb: Map<DbIdType, DielAst>;
  runtimeOutputNames: Set<RelationIdType>;
  distributions: SingleDistribution[];

  constructor(ir: DielIr, metaData: PhysicalMetaData) {
    this.ir = ir;
    this.metaData = metaData;
    // get all the outputs and loop
    const augmentedDep = this.augmentDepTree(this.ir.dependencies.depTree);
    // let's first figure out the shipping information
    this.distributions = this.distributedEval(augmentedDep);
    // organize it by db-engines so we know how to set it up
    // then construct the definitions
    this.astSpecPerDb = this.getExecutionSpecsFromDistribution(this.distributions);
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

  getExecutionSpecsFromDistribution(distributions: SingleDistribution[]): Map<DbIdType, DielAst> {
    const astSpecPerDb = new Map();
    // first get the in
    distributions.map(distribution => {
      // if (distribution.from !== distribution.to) {
      if (!astSpecPerDb.has(distribution.to)) {
        astSpecPerDb.set(distribution.to, createEmptyDielAst());
      }
      const rDef = this.ir.GetRelationDef(distribution.relationName);
      switch (rDef.relationType) {
        case RelationType.EventTable:
        case RelationType.Table:
        case RelationType.ExistingAndImmutable:
          astSpecPerDb.get(distribution.to).views.push(rDef);
          break;
        case RelationType.EventView:
        case RelationType.View:
          const originalRelationDef = getEventTableFromDerived(rDef as DerivedRelation);
          astSpecPerDb.get(distribution.to).views.push(originalRelationDef);
          break;
        default:
          LogInternalError(`RelationType Not handled: ${rDef.relationType}`);
      }
      // }
    });
    // then get the out
    return astSpecPerDb;
  }

  /**
   * recursive function to evaluate what view needs to be where
   */
  distributedEval(augmentedDep: Map<string, NodeDependencyAugmented>) {
    const selectRelationEvalOwner = this.selectRelationEvalOwner.bind(this);
    let distributionsForAllOutput: SingleDistribution[] = [];
    this.ir.GetOutputs().map(output => {
      const distributions: SingleDistribution[] = [];
      const scope = {augmentedDep, selectRelationEvalOwner, outputName: output.name};
      augmentedDep.get(output.name).dependsOn.map(dep => {
        const result = QueryDistributionRecursiveEval(distributions, scope, dep);
        // send all the final views to local
        distributions.push({
          forRelationName: output.name,
          relationName: result.relationName,
          from: result.dbId,
          to: LocalDbId,
          finalOutputName: output.name,
        });
      });
      distributionsForAllOutput = distributionsForAllOutput.concat(distributions);
    });
    return distributionsForAllOutput;
  }

  getStaticAsyncViewTrigger(outputName: string): {dbId: DbIdType, relation: RelationIdType}[] {
    return this.distributions
               .filter(d => ((d.finalOutputName === outputName)
                          && (d.to === d.from)))
               .map(d => ({
                 dbId: d.to,
                 relation: d.relationName
               }));
  }

  getShippingInfoForDbByEvent(eventTable: RelationIdType, engineId: DbIdType) {
    const destinationDbIds = this.distributions
                                .filter(d => ((d.relationName === eventTable)
                                           && (d.from === engineId)
                                           && (d.to !== d.from)))
                                .map(d => d.to);
    // right now this is overly conservative, it would wait for all the things
    // might be empty if it does not need anything
    const relationsNeeded = this.distributions
                                .filter(d => ((d.forRelationName === eventTable)
                                           && (d.to === engineId)
                                           && (d.to !== d.from)));
    return {
      destinationDbIds,
      relationsNeeded
    };
  }

  getLocalDbAst() {
    return this.getAstFromDbId(LocalDbId);
  }

  getAstFromDbId(dbId: DbIdType) {
    return this.astSpecPerDb.get(dbId);
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
    return this.astSpecPerDb.get(remoteId);
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