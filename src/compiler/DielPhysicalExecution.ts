import { DerivedRelation, RelationType, DbIdType, RelationNameType, LogicalTimestep, DielAst, Relation } from "../parser/dielAstTypes";
import { DbType, NodeDependencyAugmented, NodeDependency, DependencyTree, ExecutionSpec, TableMetaData } from "../runtime/runtimeTypes";
import { PhysicalMetaData } from "../runtime/DielRuntime";
import { GetSqlDerivedRelationFromDielRelation, SingleDistribution, GetSqlOriginalRelationFromDielRelation, QueryDistributionRecursiveEval, GetCachedEventView } from "./passes/distributeQueries";
import { LogInternalError, DielInternalErrorType, LogInternalWarning } from "../util/messages";
import { SetIntersection } from "../util/dielUtils";
import { SqlAst, CreateEmptySqlAst, SqlRelation, TriggerAst, SqlRelationType } from "../parser/sqlAstTypes";
import { TransformAstForMaterialization } from "./passes/materialization";
import { OutputToAsyncDefaultPolicty } from "../runtime/asyncPolicies";
import { DeriveOriginalRelationsAViewDependsOn, DeriveDependentRelations, getRelationReferenceDep } from "./passes/dependency";
import { GetRelationDef, GetAllOutputs, GetOriginalRelations } from "./DielAstGetters";
import { AddRelation, DeleteRelation } from "./DielAstVisitors";

export const LocalDbId = 1;

// local helper function
// not using a set here because sets do not work well over complex objects...
function addRelationIfOnlyNotExist(relationDef: SqlRelation[], newRelation: SqlRelation) {
  // TEMP
  if (!relationDef.find(r => r.rName === newRelation.rName)) {
    relationDef.push(newRelation);
    return true;
  }
  return false;
}

export class DielPhysicalExecution {
  ast: DielAst; // read only
  augmentedDep: Map<string, NodeDependencyAugmented>;
  metaData: PhysicalMetaData; // read only
  sqlAstSpecPerDb: Map<DbIdType, SqlAst>;
  distributions: SingleDistribution[];

  cachedEventViews: Set<string>;

  getEventByTimestep: (step: LogicalTimestep) => RelationNameType;

  constructor(ast: DielAst, metaData: PhysicalMetaData, getEventByTimestep: (step: LogicalTimestep) => RelationNameType) {
    this.ast = ast;
    this.metaData = metaData;
    this.getEventByTimestep = getEventByTimestep;
    // get all the outputs and loop
    this.augmentedDep = new Map<RelationNameType, NodeDependencyAugmented>();

    this.cachedEventViews = new Set();

    this.augmentDepTree();
    // let's first figure out the shipping information
    this.distributions = [];
    this.distributedEval();
    // TMP
    console.log("current distributions", this.distributions);
    // organize it by db-engines so we know how to set it up
    // then construct the definitions
    this.sqlAstSpecPerDb = new Map<DbIdType, SqlAst>();
    this.setAstSpecPerDbIfNotExist(LocalDbId);
    this.getSqlAstSpecsFromDistribution(this.distributions);

  }

  // right now just do a reset, but performance wise it's better to do incrementally
  // FIXME
  public AddDerivedAst(view: DerivedRelation) {
    // this.augmentSingleDepTreeNode(view);
    this.augmentedDep = new Map<RelationNameType, NodeDependencyAugmented>();
    this.augmentDepTree();
  }
  private setAstSpecPerDbIfNotExist(dbId: DbIdType): SqlAst {
    const ast = this.sqlAstSpecPerDb.get(dbId);
    if (ast) {
      return ast;
    } else {
      let newAst = CreateEmptySqlAst();
      this.sqlAstSpecPerDb.set(dbId, newAst);
      return newAst;
    }
  }

  // FIXME: need to look into whether this is giving things in the right order
  public GetInstructionsToAddOutput(view: DerivedRelation) {
    // we need to first figure it out what relations we need to to define to what
    // and also change the triggers now
    // the dependency is already agumented
    const originalNode = this.ast.depTree.get(view.rName);
    if (!originalNode) {
      return null;
    }
    const augmentedNode = this.augmentDepTreeNode(originalNode, view.rName);
    if (augmentedNode) this.augmentedDep.set(view.rName, augmentedNode);
    // then figure out the additional distributions
    const newDistributions = this.distributedEvalForOutput(view);
    // then figure out the ASTs
    const overallNewRelations: ExecutionSpec = [];
    newDistributions.map(distribution => {
      const newRelations = this.getExecutionSpecForSingleDistribution(distribution);
      if (newRelations) {
        const isAdded = this.addNewRelationsToExistingSpec(newRelations);
        isAdded.map((b, i) => {
          if (b) overallNewRelations.push(newRelations[i]);
        });
      }
    });
    return overallNewRelations;
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
    const rDef = GetRelationDef(this.ast, distribution.relationName);
    // const isLocal = distribution.from === distribution.to;
    if ((!distribution.to) || (!distribution.from)) {
      return LogInternalError(`to and from should be defined by now!`);
    }
    if (!rDef) return LogInternalError(`${distribution.relationName} Not found`);
    switch (rDef.relationType) {
      case RelationType.DerivedTable:
        // same for both cases
        const relationDef = GetSqlOriginalRelationFromDielRelation(rDef);
        if (relationDef) return [{dbId: distribution.to, relationDef}];
        return null;
      // the following two cases should be the same
      case RelationType.Table:
      case RelationType.EventTable: {
        const addTimeColumns = (rDef.relationType === RelationType.EventTable) && (distribution.to === LocalDbId);
        const eventTableDef = GetSqlOriginalRelationFromDielRelation(rDef, addTimeColumns);
        if (eventTableDef) return [
          {dbId: distribution.from, relationDef: eventTableDef},
          {dbId: distribution.to, relationDef: eventTableDef}
        ];
      }
      // the following two cases should be the same if caching is disabled
      case RelationType.EventView: {
        if (this.metaData.cache === true
            && distribution.from !== distribution.to
            && distribution.to === LocalDbId
            && isEventViewCacheable(rDef as DerivedRelation,
              this.metaData.relationLocation)) {
          console.log(`${rDef.rName} is cacheable`);
          this.cachedEventViews.add(rDef.rName);
          const addTimeColumns = (rDef.relationType === RelationType.EventView)
              && (distribution.to === LocalDbId);
          const cacheRelationTriplet = GetCachedEventView(rDef as DerivedRelation, addTimeColumns);
          const eventView = GetSqlDerivedRelationFromDielRelation(rDef);
          if (eventView && cacheRelationTriplet) return [
            {dbId: distribution.to, relationDef: cacheRelationTriplet.cacheTable},
            {dbId: distribution.to, relationDef: cacheRelationTriplet.referenceTable},
            {dbId: distribution.to, relationDef: cacheRelationTriplet.view},
            {dbId: distribution.from, relationDef: eventView},
            // Ordering is significant: names are first come, first served
          ];
        }
      } // else, fallthrough
      case RelationType.View: {
        const addTimeColumns = (rDef.relationType === RelationType.EventView) && (distribution.to === LocalDbId);
        const eventViewTable = GetSqlOriginalRelationFromDielRelation(rDef, addTimeColumns);
        const eventView = GetSqlDerivedRelationFromDielRelation(rDef);
        if (eventView && eventViewTable) return [
          {dbId: distribution.from, relationDef: eventView},
          {dbId: distribution.to, relationDef: eventViewTable}
        ];
      }


      case RelationType.ExistingAndImmutable: {
        if (distribution.to !== distribution.from) {
          const newTable = GetSqlOriginalRelationFromDielRelation(rDef);
          if (newTable) return [{dbId: distribution.to, relationDef: newTable}];
        }
        return null;
      }
      case RelationType.Output: {
        // both from and to must be local, and if they are not, we need to transform to create default policy
        // outputs can also be send to remotes (since they are also local views), but they cannot be sent in
        if ((distribution.from !== distribution.to) && (distribution.from !== LocalDbId)) {
          return LogInternalError(`Outputs must be local`);
        }
        const relationDef = GetSqlDerivedRelationFromDielRelation(rDef);
        if (relationDef) {
          if (distribution.to !== LocalDbId) {
            const relationDefRemote = GetSqlOriginalRelationFromDielRelation(rDef);
            return [
              {dbId: LocalDbId, relationDef},
              {dbId: distribution.to, relationDef: relationDefRemote}
            ];
          } else {
            return [{dbId: LocalDbId, relationDef}];
          }
        }
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

  private getSqlAstSpecsFromDistribution(distributions: SingleDistribution[]): void {
    const localAst = this.sqlAstSpecPerDb.get(LocalDbId);
    if (!localAst) {
      LogInternalError(`LocalAST must be defined`);
      return;
    }
    distributions.map(distribution => {
      const newRelations = this.getExecutionSpecForSingleDistribution(distribution);
      if (newRelations) this.addNewRelationsToExistingSpec(newRelations);
    });
    // need to add the static tables that are not directly referenced to main
    // find any static table that was not used by outputs...
    GetOriginalRelations(this.ast).map(r => {
      if ((r.relationType === RelationType.Table)
      || (r.relationType === RelationType.DerivedTable)) {
        if (!distributions.find(d => d.relationName === r.rName)) {
          // we need to add this to the local one
          // fixme: might be relevant for workers as well
          const newOriginal = GetSqlOriginalRelationFromDielRelation(r);
          if (newOriginal) localAst.relations.push(newOriginal);
        }
      }}
    );
    // as well as the commands
    localAst.commands = this.ast.commands;
    // add user defined programs to main db
    if (localAst.triggers.length > 0) {
      LogInternalError("Triggers should not have been defined");
    }
    const triggers: TriggerAst[] = [];
    const programsToAddRaw = this.ast.programs.get("");
    const programsToAdd = programsToAddRaw ? programsToAddRaw : [];
    this.ast.programs.forEach((v, input) => {
      triggers.push({
        tName: `${input}Trigger`, // inputs are unique since its a map
        afterRelationName: input,
        commands: [...programsToAdd, ...v ],
      });
    });
    localAst.triggers = triggers;

    // materialization pass
    this.sqlAstSpecPerDb.forEach(ast => {
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
    const ast = this.ast;
    const scope = {
      augmentedDep: this.augmentedDep,
      selectRelationEvalOwner: this.selectRelationEvalOwner.bind(this),
      outputName: output.rName,
      relationTypeLookup: (rName: string) => GetRelationDef(ast, rName).relationType,
    };
    const result = QueryDistributionRecursiveEval(newDistributions, scope, output.rName);
    if (!result) return null;
    if (result.fromDbId !== LocalDbId) {
      // apply default policy!
      const eventDeps = DeriveOriginalRelationsAViewDependsOn(this.ast.depTree, output.rName);
      const v = OutputToAsyncDefaultPolicty(output, eventDeps);
      // also add the new definitions to the DIEL AST, modify in place?
      DeleteRelation(this.ast, v.output.rName);
      AddRelation(this.ast, v.asyncView);      AddRelation(this.ast, v.output);
      // if the from of the output is not local, we need to apply
      const outputDistribution = newDistributions.find(d => d.relationName === output.rName);
      if (!outputDistribution) {
        console.log(newDistributions);
        return LogInternalError(`Should have shipping for output ${output.rName}`);
      }
      // need to modify existing distributions!
      // replace the output with the async view...
      const forOutput = newDistributions.filter(d => (d.forRelationName === output.rName) && (d.relationName !== output.rName));
      forOutput.map(f => f.forRelationName = v.asyncView.rName);
      newDistributions.push({
        forRelationName: v.asyncView.rName,
        relationName: v.asyncView.rName,
        from: result.fromDbId,
        to: LocalDbId,
        finalOutputName: output.rName,
      });
      newDistributions.push({
        forRelationName: v.output.rName,
        relationName: v.asyncView.rName,
        from: LocalDbId,
        to: LocalDbId,
        finalOutputName: output.rName,
      });
      outputDistribution.from = LocalDbId;
    }
    // newDistributions.push({
    //   forRelationName: output.rName,
    //   relationName: result.relationName,
    //   from: LocalDbId,
    //   to: LocalDbId,
    //   finalOutputName: output.rName,
    // });
    this.distributions = newDistributions.concat(this.distributions);
    return newDistributions;
  }

  /**
   * recursive function to evaluate what view needs to be where
   */
  distributedEval() {
    // let distributionsForAllOutput: SingleDistribution[] = [];
    GetAllOutputs(this.ast).map(this.distributedEvalForOutput.bind(this));
    // return distributionsForAllOutput;
  }

  /**
   * we want to figure out what relations to ship from the individual remotes
   * @param dbId
   * @param staticRelation
   * @param outputRelation
   */
  getBubbledUpRelationToShipForStatic(dbId: DbIdType, staticRelation: RelationNameType, outputRelation: RelationNameType): {destination: DbIdType, relation: RelationNameType}[] {
    const distributions = this.distributions;
    function helper(acc: {destination: DbIdType, relation: RelationNameType}[], dbId: DbIdType, relation: RelationNameType) {

      distributions.map(d => {
        if ((d.relationName === relation) && (d.from === dbId)) {
          if ((d.to === d.from) && (d.forRelationName !== relation)) {
            helper(acc, d.to, d.forRelationName);
          } else if ((d.to !== d.from)) {
            console.log("consider shipping", d);
            // only push if
            // - it's not already there
            // - and it's for the output!
            const hasAdded = acc.find(a => (a.destination === d.to) && (a.relation === d.relationName));
            const isForOutput = d.finalOutputName === outputRelation;
            if (!hasAdded && isForOutput) {
              acc.push({
                destination: d.to,
                relation: d.relationName
                });
            }
          }
        }
      });
    }
    let acc: {destination: DbIdType, relation: RelationNameType}[] = [];
    helper(acc, dbId, staticRelation);
    return acc;
  }
  /**
   * this functions figures out what views are dependent on the new relation at the db location.
   * @param dbId
   * @param eventRelation
   */
  getBubbledUpRelationToShipForEvent(dbId: DbIdType, eventRelation: RelationNameType): {destination: DbIdType, relation: RelationNameType}[] {
    const distributions = this.distributions;
    let count = 0;
    function helper(acc: {destination: DbIdType, relation: RelationNameType}[], dbId: DbIdType, relation: RelationNameType) {
      count += 1;
      if (count > 100) {
        debugger;
      }
      distributions.map(d => {
        // (d.finalOutputName === output)
        if ((d.relationName === relation) && (d.from === dbId)) {
          if ((d.to === d.from) && (d.forRelationName !== relation)) {
            helper(acc, d.to, d.forRelationName);
          } else if ((d.to !== d.from)) {
            const hasAdded = acc.find(a => (a.destination === d.to) && (a.relation === d.relationName));
            if (!hasAdded) {
              acc.push({
                destination: d.to,
                relation: d.relationName
                });
            }
          }
        }
      });
    }
    let acc: {destination: DbIdType, relation: RelationNameType}[] = [];
    helper(acc, dbId, eventRelation);
    return acc;
  }

  getStaticAsyncViewTrigger(outputName: string): {dbId: DbIdType, relation: RelationNameType}[] | null {
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
    const result: {dbId: DbIdType, relation: RelationNameType}[] = [];
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
   * @param requestTimestep
   */
  getRelationsToShipForDb(dbId: DbIdType, requestTimestep: LogicalTimestep): {
    deps: Set<RelationNameType>,
    relationsToShip: Map<RelationNameType, Set<DbIdType>>} | null {
    // a list of the views and their dependencies
    // if input is specified, we will filter dependencies by those relations that depend on the input
    const inputEvent = this.getEventByTimestep(requestTimestep);
    const allInputDeps = DeriveDependentRelations(this.ast.depTree, inputEvent);
    // the allInputDeps should also contain the original inputEvents as well.
    allInputDeps.add(inputEvent);
    if (!allInputDeps) {
      LogInternalWarning(`There are no input dependencies for ${inputEvent}`);
      return null;
    }
    const ast = this.sqlAstSpecPerDb.get(dbId);
    if (!ast) {
      return LogInternalError(`AST not defined for ${dbId}`);
    }
    const allEvents = ast.relations.filter(r => r.isDynamic).map(r => r.rName);
    // PERF FIXME: this is corase grained
    const deps = SetIntersection(new Set(allEvents), allInputDeps);
    const relationsToShip = new Map<RelationNameType, Set<DbIdType>>();
    this.distributions
        .filter(d => (d.from === dbId) && (d.from !== d.to))
        .map(d => {
          if (allInputDeps.has(d.relationName)) {
            const toShip = relationsToShip.get(d.relationName);
            if (!toShip) {
              relationsToShip.set(d.relationName, new Set([d.to]));
            } else {
              toShip.add(d.to);
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
  getShippingInfoForDbByEvent(eventTable: RelationNameType, engineId: DbIdType) {
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
    return this.sqlAstSpecPerDb.get(dbId);
  }

  augmentDepTreeNode(nodDep: NodeDependency, relationName: RelationNameType): NodeDependencyAugmented | null {
    const foundRelation = GetRelationDef(this.ast, relationName);
    if (!foundRelation) return LogInternalError(`Relation ${relationName} is not found`);
    const relationType = foundRelation.relationType;
    let remoteId;
    if (relationType === RelationType.EventTable || relationType === RelationType.Table) {
      remoteId = LocalDbId;
    } else if (relationType === RelationType.ExistingAndImmutable) {
      const foundDbId = this.getDbIdByRelationName(relationName);
      if (!foundDbId) {
        return LogInternalError(`Immutable table ${relationName} is not found`);
      }
      remoteId = foundDbId;
    }
    // undefined is fine, because we might not know, and need the recursive processing to set
    const nodeDepAugmetned: NodeDependencyAugmented = {
      remoteId,
      relationName,
      ...Object.assign({}, nodDep),
    };
    return nodeDepAugmetned;
  }

  augmentSingleDepTreeNode(nodeDep: NodeDependency, relationName: RelationNameType) {
    const nodeDepAugmetned = this.augmentDepTreeNode(nodeDep, relationName);
    if (nodeDepAugmetned) {
      this.augmentedDep.set(relationName, nodeDepAugmetned);
    } else {
      LogInternalError(`Augmented tree is null for ${relationName}`);
    }
  }
  /**
   * adding where the location is, as well as the type of location it is.
   */
  augmentDepTree(): void {
    this.ast.depTree.forEach(this.augmentSingleDepTreeNode.bind(this));
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
    return this.sqlAstSpecPerDb.get(remoteId);
  }

  getDbIdByRelationName(rName: string): DbIdType | null {
    // look up metadata
    const r = this.metaData.relationLocation.get(rName);
    if (r) {
      return r.dbId;
    } else {
      return LogInternalError(`Cannot find relation ${rName}`);
    }
  }
}

// export and extracted for testing purposes
export function dependsOnLocalTables(deps: string[], relationLocations: Map<string, TableMetaData>) {

  let dependsOnLocal = deps.some(d => {
    let loc = relationLocations.get(d);
    return loc === undefined;
  });

  return dependsOnLocal;
}

// export and extracted for testing purposes
export function dependsOnBothLocalAndForeignTables(deps: string[], relationLocations: Map<string, TableMetaData>) {
    let dependsOnForeign = deps.some(d => {
      let loc = relationLocations.get(d);
      return loc !== undefined;
    });

    let dependsOnLocal = deps.some(d => {
      let loc = relationLocations.get(d);
      return loc === undefined;
    });
    return dependsOnForeign && dependsOnLocal;
  }

/**
 * Determines whether the event view can be cached.
 * This is determined by inpecting all of the join clauses and the
 * base relation. To be cacheable, all of these must either exclusively
 * reference local tables or exclusively reference foreign tables.
 * @param relation
 * @param relationLocations
 */
export function isEventViewCacheable(relation: DerivedRelation, relationLocations: Map<string, TableMetaData>) {
    if (relation.relationType !== RelationType.EventView) {
      throw Error(`${relation.rName} is not an EventView!`);
      // TODO RYAN: Change error type
    }

    // need to check the "from" and the "joins"
    if (relation.selection.compositeSelections.length != 1) {
      return false;
    } // totally arbitrary constraint; could change in future

    let mainSelection = relation.selection.compositeSelections[0].relation;

    if (dependsOnBothLocalAndForeignTables(
      getRelationReferenceDep(mainSelection.baseRelation),
      relationLocations)) {
      return false;
    }

    let joinRelations = mainSelection.joinClauses.map(j => j.relation);

    if (joinRelations.some(c =>
      dependsOnBothLocalAndForeignTables(
        getRelationReferenceDep(c),
        relationLocations))) {
      return false;
    } else {
      return true;
    }
  }
