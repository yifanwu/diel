import { DbIdType, RelationIdType, LogicalTimestep, RelationType, Relation } from "../parser/dielAstTypes";
import { DbSetupConfig } from "./DbEngine";
import { SqlRelation } from "../parser/sqlAstTypes";

export const TIMESTEP_COlUMN_NAME = "timestep";

export const REQUEST_TIMESTEP_COlUMN_NAME = "request_timestep";

export type ExecutionSpec = {dbId: DbIdType, relationDef: SqlRelation}[];

export interface NodeDependencyAugmented extends NodeDependency {
  relationName: string;
  remoteId?: DbIdType; // only has remoteId if it's an original table
  relationType: RelationType;
}

export type NodeDependency = {
  dependsOn: RelationIdType[],
  isDependedBy: RelationIdType[]
};

// this should work for either SQL or DIEL types
export type DependencyTree = Map<RelationIdType, NodeDependency>;

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
  relationName?: RelationIdType;
  msgId?: number; // currently only used for fullfilling promises.
  lineage?: number;
}
export interface DielRemoteReply {
  id: DielRemoteMessageId;
  results: RelationObject;
  err: any;
}

interface DielRemoteMessageBase {
  remoteAction: DielRemoteAction;
  lineage: LogicalTimestep;
  msgId?: number;
}

export interface RemoteGetResultsByPromiseMessage extends RemoteExecuteMessage {
  msgId: number;
}

export interface RemoteShipRelationMessage extends DielRemoteMessageBase {
  relationName: RelationIdType;
  dbId: DbIdType;
}

export interface RemoteOpenDbMessage extends DielRemoteMessageBase {
  message?: string;     // for socket
  buffer?: Uint8Array; // for worker
}

export interface RemoteUpdateRelationMessage extends RemoteExecuteMessage {
  relationName: RelationIdType; // redundancy
}

export interface RemoteExecuteMessage extends DielRemoteMessageBase {
  sql: string;
}


export type DielRemoteMessage = RemoteGetResultsByPromiseMessage
                                | RemoteShipRelationMessage
                                | RemoteUpdateRelationMessage
                                | RemoteOpenDbMessage
                                ;