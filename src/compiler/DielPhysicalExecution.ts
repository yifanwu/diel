import { DielAst, DerivedRelation, RelationType, createEmptyDielAst, Relation, DbIdType, RelationIdType, LogicalTimestep } from "../parser/dielAstTypes";
import { DbType } from "../runtime/runtimeTypes";
import { PhysicalMetaData } from "../runtime/DielRuntime";
import { getCacheTableFromDerived, SingleDistribution, QueryDistributionRecursiveEval } from "./passes/distributeQueries";
import { LogInternalError } from "../util/messages";
import { DependencyTree, NodeDependencyAugmented } from "./passes/passesHelper";
import { SetIntersection } from "../util/dielUtils";
import { isRelationTypeDerived, DielIr } from "./DielIr";

export type RelationShippingInfo = {
  destinations: Set<DbIdType>;
  dependencies: Set<RelationIdType>;
};


export const LocalDbId = 1;
export const NoEventLineage = -1;

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

  public AddRuntimeOutput(outputName: string) {
    this.runtimeOutputNames.add(outputName);
  }

  private getExecutionSpecsFromDistribution(distributions: SingleDistribution[]): Map<DbIdType, DielAst> {
    const astSpecPerDb = new Map<DbIdType, DielAst>();
    // first get the in
    function setIfNotExist(dbId: DbIdType) {
      if (!astSpecPerDb.has(dbId)) {
        astSpecPerDb.set(dbId, createEmptyDielAst());
      }
      return astSpecPerDb.get(dbId);
    }
    function addRelationIfOnlyNotExist(relationDef: Relation[], newDef: Relation) {
      if (!relationDef.find(r => r.name === newDef.name)) {
        relationDef.push(newDef);
      }
    }
    setIfNotExist(LocalDbId);
    const setofRelationsDistributed = new Set<RelationIdType>();
    distributions.map(distribution => {
      const astToSpec = setIfNotExist(distribution.to);
      const astFromSpec = setIfNotExist(distribution.from);
      setofRelationsDistributed.add(distribution.relationName);
      const rDef = this.ir.GetRelationDef(distribution.relationName);
      if (isRelationTypeDerived(rDef.relationType)) {
        if (distribution.from !== distribution.to) {
          const {cacheTableDef, eventTableDef, cacheReferenceDef} = getCacheTableFromDerived(rDef as DerivedRelation);
          // event table for new data arrival
          addRelationIfOnlyNotExist(astToSpec.relations, cacheTableDef);
          // AND data cache
          addRelationIfOnlyNotExist(astToSpec.relations, eventTableDef);
          addRelationIfOnlyNotExist(astToSpec.relations, cacheReferenceDef);

          // add the view to the source ast
          /*
          const eventTableDef = getCacheTableFromDerived(rDef as DerivedRelation);
          addRelationIfOnlyNotExist(astToSpec.relations, eventTableDef);
          */

          addRelationIfOnlyNotExist(astFromSpec.relations, rDef);

        } else {
          // doesn't matter from or to, it's the same
          addRelationIfOnlyNotExist(astFromSpec.relations, rDef);
        }
      } else {
        // if we are shipping over, we should remove the event and just keep it vanilla table
        // if ((distribution.to !== LocalDbId) && rDef.relationType === RelationType.EventTable) {
        //   const newRDef = JSON.parse(JSON.stringify(rDef)) as OriginalRelation;
        //   newRDef.relationType = RelationType.Table;
        //   addRelationIfOnlyNotExist(astToSpec.relations, newRDef);
        // } else {
        //   addRelationIfOnlyNotExist(astToSpec.relations, rDef);
        // }
        addRelationIfOnlyNotExist(astToSpec.relations, rDef);
      }
      // these are outputs
      const astSepcLocal = setIfNotExist(LocalDbId);
      if (!astSepcLocal.relations.find(r => r.name === distribution.finalOutputName)) {
        astSepcLocal.relations.push(this.ir.GetRelationDef(distribution.finalOutputName));
      }
    });
    // need to add the static tables that are not directly referenced to main
    // find any static table that was not used by outputs...
    this.ir.GetOriginalRelations().map(r => {
      if ((r.relationType === RelationType.Table)
      || (r.relationType === RelationType.DerivedTable)) {
        if (!setofRelationsDistributed.has(r.name)) {
          // we need to add this to the local one
          // fixme: might be relevant for workers as well
          astSpecPerDb.get(LocalDbId).relations.push(r);
        }
      }}
    );
    // as well as the commands
    astSpecPerDb.get(LocalDbId).commands = this.ir.ast.commands;
    // add user defined programs to main db
    if (astSpecPerDb.get(LocalDbId).programs.size > 0) {
      LogInternalError("FIXME: need to merge instead of reset");
    }
    astSpecPerDb.get(LocalDbId).programs = this.ir.ast.programs;
    // sanity check: only localDB is allowed to have EventTables!
    // astSpecPerDb.forEach((ast, dbId) => {
    //   if (dbId !== LocalDbId) {
    //     ast.relations.map(r => {
    //       if (r.relationType === RelationType.EventTable) {
    //         LogInternalError(`only local DB instance  (${LocalDbId}) is allowed to have ${RelationType.EventTable}, but ${dbId} has it too, for ${r.name}`);
    //       }
    //     });
    //   }
      // TODO: materialization
      // commenting out for now for performance
      // const materialization = TransformAstForMaterialization(ast);
      // console.log(JSON.stringify(materialization, null, 2));
    // });
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
// , output: RelationIdType
  getBubbledUpRelationToShip(dbId: DbIdType, relation: RelationIdType): {destination: DbIdType, relation: RelationIdType}[] {
    const distributions = this.distributions;
    function helper(acc: {destination: DbIdType, relation: RelationIdType}[], dbId: DbIdType, relation: RelationIdType) {
      distributions.map(d => {
        // (d.finalOutputName === output)
        if ((d.relationName === relation) && (d.from === dbId)) {
          if ((d.to === d.from) && (d.forRelationName !== relation)) {
            helper(acc, d.to, d.forRelationName);
          } else if ((d.to !== d.from)) {
            // only push if it's not already there
            if (!acc.find(a => (a.destination === d.to) && (a.relation === d.relationName))) {
              acc.push({
                destination: d.to,
                relation: d.relationName
                });
            }
          }
        }
      });
    }
    let acc: {destination: DbIdType, relation: RelationIdType}[] = [];
    helper(acc, dbId, relation);
    return acc;
  }

  getStaticAsyncViewTrigger(outputName: string): {dbId: DbIdType, relation: RelationIdType}[] | null {
    // also need to make sure that there are no input dependnecies at all
    const remoteSources = this.distributions
                        .filter(d => ((d.finalOutputName === outputName)
                          && (d.from !== LocalDbId)
                          && (d.to === d.from)));
    // const hasInput = remoteSources.reduce((acc, v) => acc || (v.from === LocalDbId), false);
    // if (hasInput) {
      // return null;
    // } else {
    const dedupeRelations = new Set<string>();
    const result: {dbId: DbIdType, relation: RelationIdType}[] = [];
    remoteSources.map(d => {
      if (!dedupeRelations.has(d.relationName)) {
        dedupeRelations.add(d.relationName);
        result.push({
          dbId: d.from,
          relation: d.relationName
        });
      }
    });
    return result;
    // }
  }

  // TODO: we then need to fix to actually include event tables, as opposed to projecting them into tables
  // get the dependencies for the relationName, based on the input that has changed
  getRelationEventTableDependencies() {

  }
  /**
   * The goal of this function is to figure out for a specific engine, for a specific interaction
   *   what we need to ship.
   * PERF FIXME: this can be materialized
   * @param dbId
   * @param lineage
   */
  getRelationsToShipForDb(dbId: DbIdType, lineage: LogicalTimestep): {
    deps: Set<RelationIdType>,
    relationsToShip: Map<RelationIdType, Set<DbIdType>>} {
    // a list of the views and their dependencies
    // if input is specified, we will filter dependencies by those relations that depend on the input
    const inputEvent = this.getEventByTimestep(lineage);
    const allInputDeps = this.ir.dependencies.inputDependenciesAll.get(inputEvent);
    const ast = this.astSpecPerDb.get(dbId);
    const allEvents = new Set(ast.relations.filter(r => r.relationType === RelationType.EventTable).map(r => r.name));
    // PERF FIXME: this is corase grained
    const deps = SetIntersection(allEvents, allInputDeps);
    const relationsToShip = new Map<RelationIdType, Set<DbIdType>>();
    this.distributions
        .filter(d => (d.from === dbId) && (d.from !== d.to))
        .map(d => {
          if (allInputDeps.has(d.relationName)) {
            if (!relationsToShip.has(d.relationName)) {
              relationsToShip.set(d.relationName, new Set([d.to]));
            } else {
              relationsToShip.get(d.relationName).add(d.to);
            }
          }
        });
    return {
      deps,
      relationsToShip
    };
  }

  // this also needs to be recursive, because even if the inputs are not immediately shipped,
  // they might have dependencies down the line
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
          : null; // this is null because we might not know, and need the recursive processing to set
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
      return LogInternalError(`Cannot find relation ${rName}`);
    }
  }
}