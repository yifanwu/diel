import { DielAst, OriginalRelation, UdfType, ProgramsIr, DerivedRelation, RelationType, createEmptyDielAst } from "../parser/dielAstTypes";
import { RemoteType } from "../runtime/runtimeTypes";
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

export type RemoteIdType = number;

interface RemoteEngineInfo {
  // some redundancy
  ast: DielAst;
  allSharedViews: Set<string>;
  viewsToShip: Set<string>;
}

/**
 * Note that ir and metaData are read only
 *   putting the reference in the class for easier access.
 */
export class DielPhysicalExecution {
  ir: DielIr; // read only
  metaData: MetaDataPhysical; // read only
  remoteInfo: Map<RemoteIdType, RemoteEngineInfo>;
  local: DielAst;
  // maps inputNames to remote destinations
  localToRemotes: Map<string, Set<RemoteIdType>>;
  // this is to trigger evaluations of static event views
  // FIXME: might need refactoring
  staticEventViews: {
    dependentOutputs: Set<string>;
    viewName: string;
    remoteId: RemoteIdType
  }[];

  constructor(ir: DielIr, metaData: MetaDataPhysical) {
    this.ir = ir;
    this.metaData = metaData;
    this.remoteInfo = new Map();
    this.local = createEmptyDielAst();
    this.localToRemotes = new Map();
    this.local.originalRelations = DeepCopy<OriginalRelation[]>(ir.ast.originalRelations);
    this.local.udfTypes = DeepCopy<UdfType[]>(this.ir.ast.udfTypes);
    this.local.programs = this.ir.ast.programs && (this.ir.ast.programs.size > 0) ? DeepCopy<ProgramsIr>(this.ir.ast.programs) : new Map();
    const allLocalViews = this.setupViewSharingRelated();
    allLocalViews.forEach(v => {
      const viewDef = this.ir.allDerivedRelations.get(v);
      if (viewDef) {
        this.local.views.push(viewDef);
      } else {
        LogInternalError(`View ${v} not defined`);
      }
    });
    this.setupInputSharingRelated();
    // FIXME: there is actually performance issue here: even the views not dependent on the inputs will be evalauted again and shared
    //   The solution would be to have better depdency logic #PROJECT
    // basically mark the views with what inputs they are dependent on
    // also we don't need to ship all the views, just the final one that gets evaluated by the output
    // so there is a difference between the views that are shared and the views that are used by outputs
    // find all the destinations being shipped to, for the destinations that are not being shipped to
    // then subtract all the views from the sharing
              // also check if it depends on any inputs
              // if it does not, add it to staticEventViews
              // maybe we need the backward link now?
  }

  setupViewSharingRelated() {
    const outputDep = findOutputDep(this.ir);
    const allLocalViews = new Set(this.ir.ast.views.map((v) => v.name));
    this.metaData.forEach((tableMetaData, table) => {
      const info = this.findRemoteInfo(tableMetaData.remoteId, true);
      // we need to find this worker, or create it
      const viewsThatDependOnCurrentRemoteTable = generateDependenciesByName(this.ir.dependencies.depTree, table);

      // const sharedViewNameBasedOnCurrentTable = SetIntersection(, viewsThatDependOnCurrentRemoteTable);
      // new views that we need to create for the remote it lives in
      for (let sharedView of viewsThatDependOnCurrentRemoteTable) {
        const r = this.ir.allDerivedRelations.get(sharedView);
        if (r) {
          if (r.relationType !== RelationType.Output) {
            // note that the sharedView might be repeated, that's why we use a set, checking to prevent repeats
            if (!info.allSharedViews.has(sharedView)) {
              info.allSharedViews.add(sharedView);
              info.ast.views.push({
                name: sharedView,
                relationType: RelationType.View,
                selection: r.selection
              });
              // remove from main view defintion
              allLocalViews.delete(sharedView);
              // add to main static view definition
              const sharedViewDef = this.ir.allCompositeSelections.get(sharedView);
              if (sharedViewDef) {
                const newR = getStaticTableFromDerived(sharedViewDef, sharedView);
                this.local.originalRelations.push(newR);
              } else {
                LogInternalError(`Relation ${sharedView} was not found and was needed in query distribution!`);
              }
              // only ship it if it's the most immediately used
              if (outputDep.has(sharedView)) {
                info.viewsToShip.add(sharedView);
              }
            }
          }
        } else {
          LogInternalError(`Derived Relation ${sharedView} is not found`);
        }
      }
    });
    return allLocalViews;
  }
  setupInputSharingRelated() {
    // figure out what to share with the remotes
    // lets iterate on the remotes, and check against each input to decide if the input should be added
    this.remoteInfo.forEach((info, id) => {
      this.ir.dependencies.inputDependenciesAll.forEach((
          viewsThatDependsOnTheInput,
          inputName
        ) => {
        const intersect = SetIntersection(viewsThatDependsOnTheInput, info.allSharedViews);
        if (intersect.size > 0) {
          const newR = this.ir.allOriginalRelations.get(inputName);
          // not an error if null: we only want to ship original relations
          if (newR) {
            info.ast.originalRelations.push(newR);
            if (!this.localToRemotes.has(inputName)) {
              this.localToRemotes.set(inputName, new Set());
            }
            const inputDef = this.localToRemotes.get(inputName);
            if (inputDef) {
              inputDef.add(id);
            } else {
              LogInternalError(`localToRemotes not defined for ${inputName}`);
            }
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

  findRemoteInfo(id: RemoteIdType, shouldCreate = false) {
    const r = this.remoteInfo.get(id);
    if (r) {
      return r;
    } else if (shouldCreate) {
      const info: RemoteEngineInfo = {
        ast: createEmptyDielAst(),
        allSharedViews: new Set(),
        viewsToShip: new Set()
      };
      this.remoteInfo.set(id, info);
      return info;
    } else {
      throw LogInternalError(`findRemote on ${id} did not return a value!`);
    }
  }
}