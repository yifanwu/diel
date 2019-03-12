import { DielAst, DerivedRelation, RelationType, createEmptyDielAst } from "../parser/dielAstTypes";
import { DbType } from "../runtime/runtimeTypes";
import { DielIr } from "../lib";
import { PhysicalMetaData } from "../runtime/DielRuntime";
import { getEventTableFromDerived, SingleDistribution, QueryDistributionRecursiveEval } from "./passes/distributeQueries";
import { LogInternalError } from "../lib/messages";
import { DependencyTree, NodeDependencyAugmented } from "./passes/passesHelper";
import { SetIntersection } from "../lib/dielUtils";
import { isRelationTypeDerived } from "./DielIr";

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

// export type RelationDependency = Map<RelationIdType Set<RelationIdType>>;
// export type RelationDestinations =

// export type JobPerInput = {
//   viewToShip: RelationIdType,
//   viewsToGet: Set<RelationIdType>,
//   dependentOutput: Set<RelationIdType>,
//   destinations: Set<DbIdType>
// };

// HARDCODED
export const LocalDbId = 1;
export const NoEventLineage = -1;
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
  getEventByTimestep: (step: LogicalTimestep) => RelationIdType;

  constructor(ir: DielIr, metaData: PhysicalMetaData, getEventByTimestep: (step: LogicalTimestep) => RelationIdType) {
    this.ir = ir;
    this.metaData = metaData;
    this.getEventByTimestep = getEventByTimestep;
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
    const astSpecPerDb = new Map<DbIdType, DielAst>();
    // first get the in
    distributions.map(distribution => {
      // if (distribution.from !== distribution.to) {
      if (!astSpecPerDb.has(distribution.to)) {
        astSpecPerDb.set(distribution.to, createEmptyDielAst());
      }
      // there are quite a few repetitions because the list is denormalized (fanout by outputs)
      const currenRelationDef = astSpecPerDb.get(distribution.to).relations;
      if (!currenRelationDef.find(r => r.name === distribution.relationName)) {
        const rDef = this.ir.GetRelationDef(distribution.relationName);
        // we should transform it if it's been shipped over, and that it was a derived view before
        if ((distribution.from !== distribution.to) && isRelationTypeDerived(rDef.relationType)) {
          const derivedRelation = getEventTableFromDerived(rDef as DerivedRelation);
          currenRelationDef.push(derivedRelation);
        } else {
          currenRelationDef.push(rDef);
        }
      }
      // these are outputs
      if (!astSpecPerDb.get(LocalDbId).relations.find(r => r.name === distribution.finalOutputName)) {
        astSpecPerDb.get(LocalDbId).relations.push(this.ir.GetRelationDef(distribution.finalOutputName));
      }
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

  getStaticAsyncViewTrigger(outputName: string): {dbId: DbIdType, relation: RelationIdType, destination: DbIdType}[] {
    const remoteSources = this.distributions
                        .filter(d => ((d.finalOutputName === outputName)
                          && (d.to === d.from)
                          && (d.from !== LocalDbId)));
    // now we recurse on the sources to see if they need to be shipped anywhere
    const result: {dbId: DbIdType, relation: RelationIdType, destination: DbIdType}[] = [];
    remoteSources.map(source => {
      this.distributions
          .filter(d => ((d.finalOutputName === outputName)
                    && (d.to !== d.from)
                    && (d.relationName === source.relationName)
                    && (d.from === source.to)))
          .map(d => {
            if (!result.find(r => (r.dbId === d.from) && (r.relation === d.relationName) && (r.destination === d.to))) {
              result.push({
                dbId: d.from,
                relation: d.relationName,
                destination: d.to
              });
            }
          });
    });
    return result;
                  //         return            .map(d => {
                  // const destinations = this.distributions
                  //                          .filter(d2 => (d2.from === d.from)
                  //                                     && (d2.to !== d2.from))
                  //                          .map(d2 => d2.to);
              //     return {
              //       dbId: d.to,
              //       relation: d.relationName,
              //       destinations
              //     };
              //  });
  }

  // FIXME: there is probably a faster way to do this as part of the recursion...
  getRelationDependenciesForDb(dbId: DbIdType, lineage: LogicalTimestep) {
    // a list of the views and their dependencies
    // if input is specified, we will filter dependencies by those relations that depend on the input
    const relationsToShip = this.distributions.filter(d => (d.from === dbId)).map(d => d.relationName);
    const relationDependency: Map<RelationIdType, Set<RelationIdType>> = new Map();
    // const relationDestinations: Map<RelationIdType, Set<RelationIdType>> = new Map();
    relationsToShip.map(r => {
      const singleDependency = this.distributions.filter(d => (d.forRelationName === r) && (d.to === dbId)).map(d => d.relationName);
      // const destinations = this.distributions.filter(d => (d.from === dbId) && (d.relationName === r)).map(d => d.to);
      let deps;
      if (lineage === NoEventLineage ) {
        deps = new Set(singleDependency);
      } else {
        const inputEvent = this.getEventByTimestep(lineage);
        deps = SetIntersection(new Set(singleDependency), this.ir.dependencies.inputDependenciesAll.get(inputEvent));
      }
      relationDependency.set(r, deps);
    });
    return relationDependency;
  }

  getRelationsToShipForDb(dbId: DbIdType, lineage: LogicalTimestep) {
    // a list of the views and their dependencies
    // if input is specified, we will filter dependencies by those relations that depend on the input
    const relationsToShip = new Map<RelationIdType, Set<DbIdType>>();
    this.distributions
        .filter(d => (d.from === dbId) && (d.from !== d.to))
        .map(d => {
          if (!relationsToShip.has(d.relationName)) {
            relationsToShip.set(d.relationName, new Set([d.to]));
          } else {
            relationsToShip.get(d.relationName).add(d.to);
          }
        });
    return relationsToShip;
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
      const relationType = this.ir.GetRelationDef(relationName).relationType;
      const remoteId = (relationType === RelationType.EventTable || relationType === RelationType.Table)
        ? LocalDbId
        : (relationType === RelationType.ExistingAndImmutable)
          ? this.getDbIdByRelationName(relationName)
          : null;
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
    for (let dbId of dbIds) {
      const dbMetaData = this.metaData.dbs.get(dbId);
      if (dbMetaData) {
        const dbType = dbMetaData.dbType;
        switch (dbType) {
          case DbType.Socket: {
            return dbId;
          }
          case DbType.Worker: {
            workerId = dbId;
          }
        }
      } else {
        debugger;
      }
    }
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