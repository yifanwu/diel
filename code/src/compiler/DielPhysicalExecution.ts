import { DielAst, OriginalRelation, UdfType, ProgramsIr, DerivedRelation, RelationType, createEmptyDielAst } from "../parser/dielAstTypes";
import { TableLocation } from "../runtime/runtimeTypes";
import { DielIr } from "../lib";
import { MetaDataPhysical } from "../runtime/DielRuntime";
import { generateDependenciesByName } from "./passes/dependnecy";
import { DeepCopy, SetIntersection } from "../lib/dielUtils";
import { findOutputDep, getStaticTableFromDerived, generateShipWorkerInputClause } from "./passes/distributeQueries";
import { LogInternalError } from "../lib/messages";

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

type RemoteLocType = number;

export interface RemoteIdentification {
  location: TableLocation;
  accessInfo: RemoteLocType;
}

interface RemoteEngineInfo {
  ast: DielAst;
  sharedViews: Set<string>;
}

export class RemoteDbEngines {
}

/**
 * Note that ir and metaData are read only
 *   putting the reference in the class for easier access.
 */
export class DielPhysicalExecution {
  ir: DielIr; // read only
  metaData: MetaDataPhysical; // read only
  remotes: {id: RemoteIdentification, info: RemoteEngineInfo}[];
  local: DielAst;
  // maps inputNames to remote destinations
  localToRemotes: Map<string, Set<RemoteIdentification>>;

  constructor(ir: DielIr, metaData: MetaDataPhysical) {
    this.ir = ir;
    this.metaData = metaData;
    this.remotes = [];
    this.local = createEmptyDielAst();
    this.localToRemotes = new Map();
    this.local.originalRelations = DeepCopy<OriginalRelation[]>(ir.ast.originalRelations);
    this.local.udfTypes = DeepCopy<UdfType[]>(this.ir.ast.udfTypes);
    this.local.programs = this.ir.ast.programs && (this.ir.ast.programs.size > 0) ? DeepCopy<ProgramsIr>(this.ir.ast.programs) : new Map();
    const allLocalViews = this.setupViewSharingRelated();
    allLocalViews.forEach(v => {
      this.local.views.push(this.ir.allDerivedRelations.get(v));
    });
    this.setupInputSharingRelated();
  }
  setupViewSharingRelated() {
    const outputDep = findOutputDep(this.ir);
    const allLocalViews = new Set(this.ir.ast.views.map((v) => v.name));
    this.metaData.forEach((tableMetaData, table) => {
      const remote = this.findRemote(tableMetaData.engineId, true);
      // we need to find this worker, or create it
      const viewsThatDependOnCurrentRemoteTable = generateDependenciesByName(this.ir.dependencies.depTree, table);

      const sharedViewNameBasedOnCurrentTable = SetIntersection(outputDep, viewsThatDependOnCurrentRemoteTable);
      // new views that we need to create for the remote it lives in
      for (let sharedView of sharedViewNameBasedOnCurrentTable) {
        const r = this.ir.allDerivedRelations.get(sharedView);
        if (r.relationType !== RelationType.Output) {
          // note that the sharedView might be repeated, that's why we use a set, checking to prevent repeats
          if (!remote.info.sharedViews.has(sharedView)) {
            remote.info.sharedViews.add(sharedView);
            remote.info.ast.views.push({
              name: sharedView,
              relationType: RelationType.View,
              selection: r.selection
            });
          }
          // remove from main view defintion
          allLocalViews.delete(sharedView);
          // add to main static view definition
          const newR = getStaticTableFromDerived(this.ir.allCompositeSelections.get(sharedView), sharedView);
          if (!newR) {
            LogInternalError(`Relation ${sharedView} was not found and was needed in query distribution!`);
          }
          this.local.originalRelations.push(newR);
        }
      }
    });
    return allLocalViews;
  }
  setupInputSharingRelated() {
    // figure out what to share with the remotes
    // lets iterate on the remotes, and check against each input to decide if the input should be added
    this.remotes.map(remote => {
      this.ir.dependencies.inputDependenciesAll.forEach((
          viewsThatDependsOnTheInput,
          inputName
        ) => {
        const intersect = SetIntersection(viewsThatDependsOnTheInput, remote.info.sharedViews);
        if (intersect.size > 0) {
          const newR = this.ir.allOriginalRelations.get(inputName);
          // not an error if null: we only want to ship original relations
          if (newR) {
            remote.info.ast.originalRelations.push(newR);
            if (!this.localToRemotes.has(inputName)) {
              this.localToRemotes.set(inputName, new Set());
            }
            this.localToRemotes.get(inputName).add(remote.id);
            // also add to the local program
            const p = this.local.programs.get(inputName);
            const newClause = generateShipWorkerInputClause(inputName);
            if (p) {
              p.push(newClause);
            } else {
              this.local.programs.set(inputName, [newClause]);
            }
          }
        }
      });
    });

  }

  findRemote(id: RemoteIdentification, shouldCreate = false) {
    const r = this.remotes.find((r) => ((r.id.accessInfo === id.accessInfo) && (r.id.location === id.location)));
    if (r) {
      return r;
    } else if (shouldCreate) {
      const newRemote = {
        id,
        info: {
          ast: createEmptyDielAst(),
          sharedViews: new Set()
        }
      };
      this.remotes.push(newRemote);
      // ugh pointers...
      return newRemote;
    } else {
      throw LogInternalError(`findRemote on ${id} did not return a value!`);
    }
  }

  EnumerateAllRemotes(f: (id: RemoteIdentification, info: RemoteEngineInfo) => any) {
    this.remotes.map(r => {
      f(r.id, r.info);
    });
  }
  GetRemoteSetupAstById(i: RemoteIdentification) {

  }
  GetEventViewsToShare(i: RemoteIdentification) {
    return this.findRemote(i).info.sharedViews;
  }
}