import { DielAst, DerivedRelation, RelationType, createEmptyDielAst, Relation, DbIdType, RelationIdType, LogicalTimestep } from "../parser/dielAstTypes";
import { DbType, NodeDependencyAugmented, NodeDependency, DependencyTree, ExecutionSpec } from "../runtime/runtimeTypes";
import { PhysicalMetaData } from "../runtime/DielRuntime";
import { getEventTableFromDerived, SingleDistribution, QueryDistributionRecursiveEval } from "./passes/distributeQueries";
import { LogInternalError, DielInternalErrorType } from "../util/messages";
import { SetIntersection } from "../util/dielUtils";
import { IsRelationTypeDerived, DielIr } from "./DielIr";

export const LocalDbId = 1;

// local helper function
// not using a set here because sets do not work well over complex objects...
function addRelationIfOnlyNotExist(relationDef: Relation[], newDef: Relation) {
  if (!relationDef.find(r => r.rName === newDef.rName)) {
    relationDef.push(newDef);
    return true;
  }
  return false;
}

export class DielPhysicalExecution {
  ir: DielIr; // read only
  augmentedDep: Map<string, NodeDependencyAugmented>;
  metaData: PhysicalMetaData; // read only
  astSpecPerDb: Map<DbIdType, DielAst>;
  distributions: SingleDistribution[];
  getEventByTimestep: (step: LogicalTimestep) => RelationIdType;

  constructor(ir: DielIr, metaData: PhysicalMetaData, getEventByTimestep: (step: LogicalTimestep) => RelationIdType) {
    this.ir = ir;
    this.metaData = metaData;
    this.getEventByTimestep = getEventByTimestep;
    // get all the outputs and loop
    this.augmentedDep = this.augmentDepTree(this.ir.dependencies.depTree);
    // let's first figure out the shipping information
    this.distributions = [];
    this.distributedEval();
    // organize it by db-engines so we know how to set it up
    // then construct the definitions
    this.astSpecPerDb = new Map<DbIdType, DielAst>();
    this.setAstSpecPerDbIfNotExist(LocalDbId);
    this.getExecutionSpecsFromDistribution(this.distributions);
  }

  private setAstSpecPerDbIfNotExist(dbId: DbIdType) {
    if (!this.astSpecPerDb.has(dbId)) {
      this.astSpecPerDb.set(dbId, createEmptyDielAst());
    }
    return this.astSpecPerDb.get(dbId);
  }

  // FIXME: need to look into whether this is giving things in the right order
  public GetInstructionsToAddOutput(view: DerivedRelation) {
    // we need to first figure it out what relations we need to to define to what
    // and also change the triggers now
    // the dependency is already agumented
    this.augmentDepTreeNode(this.ir.dependencies.depTree.get(view.rName), view.rName);
    // then figure out the additional distributions
    const newDistributions = this.distributedEvalForOutput(view);
    // then figure out the ASTs
    const overallNewRelations: ExecutionSpec = [];
    newDistributions.map(distribution => {
      const newRelations = this.getExecutionSpecForSingleDistribution(distribution);
      const isAdded = this.addNewRelationsToExistingSpec(newRelations);
      isAdded.map((b, i) => {
        if (b) overallNewRelations.push(newRelations[i]);
      });
    });
    return overallNewRelations;
    // const newRelations = this.getExecutionSpecForSingleDistribution(newDistributions);
    // this.addNewRelationsToExistingSpec(newRelations);
    // const newSpecs = this.addNewRelationsToExistingSpec();
  }

  // TODO
  public GetInstructionsToRemoveQuery() {
    LogInternalError("GetInstructionsToRemoveQuery TODO", DielInternalErrorType.NotImplemented);
  }

  private getExecutionSpecForSingleDistribution(distribution: SingleDistribution): ExecutionSpec {
    const newRelations: ExecutionSpec = [];
    const rDef = this.ir.GetRelationDef(distribution.relationName);
    if (IsRelationTypeDerived(rDef.relationType)) {
      if (distribution.from !== distribution.to) {
        const eventTableDef = getEventTableFromDerived(rDef as DerivedRelation);
        // if (addRelationIfOnlyNotExist(astToSpec.relations, eventTableDef)) {
        newRelations.push({dbId: distribution.to, relationDef: eventTableDef});
        // }
        // newRelations.push({dbId: distribution.from, relationDef: rDef});
        // addRelationIfOnlyNotExist(astFromSpec.relations, rDef);
      }
      newRelations.push({dbId: distribution.from, relationDef: rDef});
      // doesn't matter from or to, it's the same
      // addRelationIfOnlyNotExist(astFromSpec.relations, rDef);
    } else {
      // FIXME: figureout why we don't need to check for types here?....
      // if we are shipping over, we should remove the event and just keep it vanilla table
      // if ((distribution.to !== LocalDbId) && rDef.relationType === RelationType.EventTable) {
      //   const newRDef = JSON.parse(JSON.stringify(rDef)) as OriginalRelation;
      //   newRDef.relationType = RelationType.Table;
      //   addRelationIfOnlyNotExist(astToSpec.relations, newRDef);
      // } else {
      //   addRelationIfOnlyNotExist(astToSpec.relations, rDef);
      // }
      // addRelationIfOnlyNotExist(astToSpec.relations, rDef);
      newRelations.push({dbId: distribution.to, relationDef: rDef});
    }
    // these are outputs
    newRelations.push({dbId: LocalDbId, relationDef: this.ir.GetRelationDef(distribution.finalOutputName)});
    // const astSepcLocal = this.setAstSpecPerDbIfNotExist(LocalDbId);
    // if (!astSepcLocal.relations.find(r => r.name === distribution.finalOutputName)) {
    //   astSepcLocal.relations.push();
    // }
    return newRelations;
  }

  private addNewRelationsToExistingSpec(newRelations: {dbId: DbIdType, relationDef: Relation}[]): boolean[] {
    return newRelations.map(newR => {
      const astSpec = this.setAstSpecPerDbIfNotExist(newR.dbId);
      return addRelationIfOnlyNotExist(astSpec.relations, newR.relationDef);
    });
  }

  private getExecutionSpecsFromDistribution(distributions: SingleDistribution[]) {
    distributions.map(distribution => {
      const newRelations = this.getExecutionSpecForSingleDistribution(distribution);
      this.addNewRelationsToExistingSpec(newRelations);
    });
    // need to add the static tables that are not directly referenced to main
    // find any static table that was not used by outputs...
    this.ir.GetOriginalRelations().map(r => {
      if ((r.relationType === RelationType.Table)
      || (r.relationType === RelationType.DerivedTable)) {
        if (!distributions.find(d => d.relationName === r.rName)) {
          // we need to add this to the local one
          // fixme: might be relevant for workers as well
          this.astSpecPerDb.get(LocalDbId).relations.push(r);
        }
      }}
    );
    // as well as the commands
    this.astSpecPerDb.get(LocalDbId).commands = this.ir.ast.commands;
    // add user defined programs to main db
    if (this.astSpecPerDb.get(LocalDbId).programs.size > 0) {
      LogInternalError("FIXME: need to merge instead of reset");
    }
    this.astSpecPerDb.get(LocalDbId).programs = this.ir.ast.programs;
  }

  // FIXME: double check that the distributions are properly pushed
  distributedEvalForOutput(output: DerivedRelation) {
    const newDistributions: SingleDistribution[] = [];
    const scope = {
      augmentedDep: this.augmentedDep,
      selectRelationEvalOwner: this.selectRelationEvalOwner.bind(this),
      outputName: output.rName
    };
    this.augmentedDep.get(output.rName).dependsOn.map(dep => {
      const result = QueryDistributionRecursiveEval(newDistributions, scope, dep);
      // send all the final views to local
      newDistributions.push({
        forRelationName: output.rName,
        relationName: result.relationName,
        from: result.dbId,
        to: LocalDbId,
        finalOutputName: output.rName,
      });
    });
    this.distributions = newDistributions.concat(this.distributions);
    return newDistributions;
  }

  /**
   * recursive function to evaluate what view needs to be where
   */
  distributedEval() {
    // let distributionsForAllOutput: SingleDistribution[] = [];
    this.ir.GetOutputs().map(this.distributedEvalForOutput);
    // return distributionsForAllOutput;
  }

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
    const allEvents = new Set(ast.relations.filter(r => r.relationType === RelationType.EventTable).map(r => r.rName));
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

  augmentDepTreeNode(nodDep: NodeDependency, relationName: RelationIdType) {
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
    return nodeDepAugmetned;
  }
  /**
   * adding where the location is, as well as the type of location it is.
   */
  augmentDepTree(depTree: DependencyTree) {
    const augmentedTree = new Map<RelationIdType, NodeDependencyAugmented>();
    depTree.forEach((nodeDep, relationName) => {
      const nodeDepAugmetned = this.augmentDepTreeNode(nodeDep, relationName);
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