import { DbIdType, RelationNameType, LogicalTimestep, RelationType, Relation, ToBeFilled } from "../parser/dielAstTypes";
import { DbSetupConfig } from "./DbEngine";
import { SqlRelation } from "../parser/sqlAstTypes";

export type ExecutionSpec = {dbId: DbIdType, relationDef: SqlRelation}[];

export interface NodeDependencyAugmented extends NodeDependency {
  remoteId?: ToBeFilled<DbIdType>; // only has remoteId if it's an original table
}

export type NodeDependency = {
  relationName: string;
  dependsOn: RelationNameType[],
  isDependedBy: RelationNameType[],
  // the following should probably be refactored, but convenient for now.
  isDynamic: boolean; // e.g. event tables are
};

// this should work for either SQL or DIEL types
export type DependencyTree = Map<RelationNameType, NodeDependency>;

export interface DependencyInfo {
  // both ways for easy access
  depTree: DependencyTree;
  topologicalOrder: string[];
  inputDependenciesOutput: Map<string, Set<string>>;
  inputDependenciesAll: Map<string, Set<string>>;
}

export interface DielConfig {
  dielFiles: string[];
  setupCb: () => void;
  showLog?: boolean;
  isStrict?: boolean;
  mainDbPath?: string;
  dbConfigs?: DbSetupConfig[];
  caching?: boolean;
}

export type GetRelationToShipFuncType = (dbId: DbIdType, relation: string, step: LogicalTimestep) => Set<string>;

export type RecordObject = {[index: string]: string | number | Uint8Array};
export type RelationObject = RecordObject[];

export enum DbType {
  Local = "Local",
  Worker = "Worker",
  Socket = "Socket"
}

// TODO: add more runtime info
// e.g., number of times accessed etc.
export interface TableMetaData {
  dbId: DbIdType;
}

export enum DielRemoteAction {
  ConnectToDb = "ConnectToDb",
  GetResultsByPromise = "GetResultsByPromise",
  DefineRelations = "DefineRelations",
  UpdateRelation = "UpdateRelation",
  ShipRelation = "ShipRelation",
  CleanUpQueries = "CleanUpQueries"
}

export interface DielRemoteMessageId {
  remoteAction: DielRemoteAction;
  relationName?: RelationNameType;
  msgId?: number; // currently only used for fullfilling promises.
  requestTimestep?: number;
}
export interface DielRemoteReply {
  id: DielRemoteMessageId;
  results: RelationObject;
  err: any;
}

interface DielRemoteMessageBase {
  remoteAction: DielRemoteAction;
  requestTimestep: LogicalTimestep;
  msgId?: number;
}

export interface RemoteGetResultsByPromiseMessage extends RemoteExecuteMessage {
  msgId: number;
}

export interface RemoteShipRelationMessage extends DielRemoteMessageBase {
  relationName: RelationNameType;
  dbId: DbIdType;
}

export interface RemoteOpenDbMessage extends DielRemoteMessageBase {
  message?: string;     // for socket
  buffer?: Uint8Array; // for worker
}

export interface RemoteUpdateRelationMessage extends RemoteExecuteMessage {
  relationName: RelationNameType; // redundancy
}

export interface RemoteExecuteMessage extends DielRemoteMessageBase {
  sql: string;
}


export type DielRemoteMessage = RemoteGetResultsByPromiseMessage
                                | RemoteShipRelationMessage
                                | RemoteUpdateRelationMessage
                                | RemoteOpenDbMessage
                                ;