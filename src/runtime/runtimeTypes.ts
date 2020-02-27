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

export type QueryResult = (string|number)[][];

export interface DataflowPerNodeMetaData {
  eventTable: RelationNameType;
  deps: Set<RelationNameType>;
  relationsToShip: Map<RelationNameType, Set<DbIdType>>;
}

export enum DielRemoteAction {
  // the following are set up
  SetUpWebWorkerFile = "SetUpWebWorkerFile", // just for webworkers...
  SetExecutionMetaData = "ExecutionMetaData",
  SetCleanUpQueries = "CleanUpQueries",
  DefineDbId = "DefineDbId",
  // the following are at runtime
  DefineRelations = "DefineRelations",
  UpdateRelation = "UpdateRelation",
  ShipRelation = "ShipRelation",
  Close = "Close",
  // strange.. think about cutting
  GetResultsByPromise = "GetResultsByPromise",
}

interface DielRemoteMessageBase {
  action: DielRemoteAction;
  requestTimestep: LogicalTimestep;
}


export interface DielRemoteReply extends DielRemoteMessageBase {
  results: RelationObject;
  err: any;
}

export interface RemoteExecuteMessage extends DielRemoteMessageBase {
  sql: string;
}

export interface RemoteGetResultsByPromiseMessage extends RemoteExecuteMessage {
  msgId: number;
}

export interface RemoteUpdateRelationMessage extends RemoteExecuteMessage {
  // this is used for metadata
  updateRelationName: RelationNameType;
  // this is used for figuring out the metadata
  eventTableName: RelationNameType;
}

export interface RemoteShipRelationMessage extends DielRemoteMessageBase {
  relationName: RelationNameType;
  dbId: DbIdType;
  eventTableName: RelationNameType;
}

// note that we have to do it
export interface WorkerOpenDbMessage extends DielRemoteMessageBase {
  // buffer: Uint8Array;
  filePath: string;
}



export interface RemoteIdMessage extends DielRemoteMessageBase {
  dbId: DbIdType;
}

export type DielRemoteMessage = RemoteGetResultsByPromiseMessage
                                | RemoteShipRelationMessage
                                | RemoteUpdateRelationMessage
                                | WorkerOpenDbMessage
                                | RemoteIdMessage
                                ;