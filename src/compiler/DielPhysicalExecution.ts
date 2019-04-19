import { DerivedRelation, RelationType, Relation, DbIdType, RelationIdType, LogicalTimestep } from "../parser/dielAstTypes";
import { DbType, NodeDependencyAugmented, NodeDependency, DependencyTree, ExecutionSpec } from "../runtime/runtimeTypes";
import { PhysicalMetaData } from "../runtime/DielRuntime";
import { GetSqlViewAstFromDielAst, SingleDistribution, GetSqlTableAstFromDielAst, QueryDistributionRecursiveEval } from "./passes/distributeQueries";
import { LogInternalError, DielInternalErrorType, LogInfo } from "../util/messages";
import { SetIntersection } from "../util/dielUtils";
import { IsRelationTypeDerived, DielIr } from "./DielIr";
import { SqlAst, CreateEmptySqlAst, SqlRelation, TriggerAst, SqlRelationType } from "../parser/sqlAstTypes";
import { TransformAstForMaterialization } from "./passes/materialization";
import { OutputToAsyncDefaultPolicty } from "../runtime/asyncPolicies";
import { GetOriginalRelationsAViewDependsOn } from "./passes/dependency";

export const LocalDbId = 1;

// local helper function
// not using a set here because sets do not work well over complex objects...
function addRelationIfOnlyNotExist(relationDef: SqlRelation[], newRelation: SqlRelation) {
  if (!relationDef.find(r => r.rName === newRelation.rName)) {
    relationDef.push(newRelation);
    return true;
  }
  return false;
}

export class DielPhysicalExecution {
  ir: DielIr; // read only
  augmentedDep: Map<string, NodeDependencyAugmented>;
  metaData: PhysicalMetaData; // read only
  astSpecPerDb: Map<DbIdType, SqlAst>;
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
    this.astSpecPerDb = new Map<DbIdType, SqlAst>();
    this.setAstSpecPerDbIfNotExist(LocalDbId);
    this.getExecutionSpecsFromDistribution(this.distributions);
  }

  private setAstSpecPerDbIfNotExist(dbId: DbIdType) {
    if (!this.astSpecPerDb.has(dbId)) {
      this.astSpecPerDb.set(dbId, CreateEmptySqlAst());
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

  /**
   * Distributed execution core
   * the logic is as follows:
   * if the from is a different location from the to,
   *   then make the destination a table, and the original location
   * else
   *   if the relation is static and immutable, do nothing
   *      else, define it
   * YIFAN TODO: this needs testing!
   */
  private getExecutionSpecForSingleDistribution(distribution: SingleDistribution): ExecutionSpec | null {
    const rDef = this.ir.GetRelationDef(distribution.relationName);
    // const isLocal = distribution.from === distribution.to;
    switch (rDef.relationType) {
      case RelationType.DerivedTable:
        // same for both cases
        return [{dbId: distribution.to, relationDef: GetSqlTableAstFromDielAst(rDef)}];
      // the following two cases should be the same
      case RelationType.Table:
      case RelationType.EventTable: {
        const eventTableDef = GetSqlTableAstFromDielAst(rDef);
        return [
          {dbId: distribution.from, relationDef: eventTableDef},
          {dbId: distribution.to, relationDef: eventTableDef}
        ];
      }
      // the following two cases should be the same
      case RelationType.View:
      case RelationType.EventView: {
        const eventViewTable = GetSqlTableAstFromDielAst(rDef);
        const eventView = GetSqlViewAstFromDielAst(rDef);
        return [
          {dbId: distribution.from, relationDef: eventView},
          {dbId: distribution.to, relationDef: eventViewTable}
        ];
      }
      case RelationType.ExistingAndImmutable: {
        const newTable = GetSqlTableAstFromDielAst(rDef);
        return [{dbId: distribution.to, relationDef: newTable}];
      }
      case RelationType.Output: {
        // both from and to must be local, and if they are not, we need to transform to create default policy
        if ((distribution.from !== distribution.to) || (distribution.from !== LocalDbId)) {
          return LogInternalError(`Outputs must be local`);
        }
        const relationDef = GetSqlViewAstFromDielAst(rDef);
        return [{dbId: LocalDbId, relationDef}];
      }
      default:
        return LogInternalError(`Union types`, DielInternalErrorType.UnionTypeNotAllHandled);
    }
  }

  private addNewRelationsToExistingSpec(newRelations: ExecutionSpec): boolean[] {
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
          this.astSpecPerDb.get(LocalDbId).relations.push(GetSqlTableAstFromDielAst(r));
        }
      }}
    );
    // as well as the commands
    this.astSpecPerDb.get(LocalDbId).commands = this.ir.ast.commands;
    // add user defined programs to main db
    if (this.astSpecPerDb.get(LocalDbId).triggers.length > 0) {
      LogInternalError("Triggers should not have been defined");
    }
    const triggers: TriggerAst[] = [];
    const programsToAddRaw = this.ir.ast.programs.get("");
    const programsToAdd = programsToAddRaw ? programsToAddRaw : [];
    this.ir.ast.programs.forEach((v, input) => {
      triggers.push({
        tName: `${input}Trigger`, // inputs are unique since its a map
        afterRelationName: input,
        commands: [...programsToAdd, ...v ],
      });
    });
    this.astSpecPerDb.get(LocalDbId).triggers = triggers;

    // materialization pass
    this.astSpecPerDb.forEach(ast => {
      TransformAstForMaterialization(ast);
    });
  }

  /**
   * This is where we apply the default async policies
   * so if any of the relations are remote, we will have the relation 
   * @param output 
   */
  distributedEvalForOutput(output: DerivedRelation) {
    const newDistributions: SingleDistribution[] = [];
    const scope = {
      augmentedDep: this.augmentedDep,
      selectRelationEvalOwner: this.selectRelationEvalOwner.bind(this),
      outputName: output.rName
    };
    const result = QueryDistributionRecursiveEval(newDistributions, scope, output.rName);
    if (result.dbId !== LocalDbId) {
      // apply default policy!
      const eventDeps = SetIntersection(GetOriginalRelationsAViewDependsOn(output.rName, this.ir.dependencies.depTree), new Set(this.ir.GetEventRelationNames()));
      const v = OutputToAsyncDefaultPolicty(output, eventDeps);
      // also add the new definitions to the DIEL AST, modify in place?
      this.ir.DeleteRelation(v.output.rName);
      this.ir.AddRelation(v.output);
      this.ir.AddRelation(v.asyncView);
      newDistributions.push({
        forRelationName: output.rName,
        relationName: v.asyncView.rName,
        from: result.dbId,
        to: LocalDbId,
        finalOutputName: output.rName,
      });
    } else {
      newDistributions.push({
        forRelationName: output.rName,
        relationName: result.relationName,
        from: result.dbId,
        to: LocalDbId,
        finalOutputName: output.rName,
      });
    }
    this.distributions = newDistributions.concat(this.distributions);
    return newDistributions;
  }

  /**
   * recursive function to evaluate what view needs to be where
   */
  distributedEval() {
    // let distributionsForAllOutput: SingleDistribution[] = [];
    this.ir.GetOutputs().map(this.distributedEvalForOutput.bind(this));
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
   * The goal of this function is to figure out for a specific engine, for a specific interaction what we need to ship.
   * Note that views might change too, if they are shipped, so the shipping logic is not limited the original tables
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
    const allEvents = new Set(ast.relations.filter(r => r.relationType === SqlRelationType.DynamicTable).map(r => r.rName));
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