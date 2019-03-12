import { SelectionUnit } from "../parser/dielAstTypes";
import { DbIdType, RelationIdType, LogicalTimestep } from "../compiler/DielPhysicalExecution";

export type QueryId = number;

export interface DielRuntimeConfig {
  dielFiles: string[];
  mainDbPath?: string;
  workerDbPaths?: string[];
  socketConnections?: {url: string, dbName: string}[];
}

export type GetRelationToShipFuncType = (dbId: DbIdType, relation: string, step: LogicalTimestep) => Set<string>;

export type RecordObject = {[index: string]: string | number | Uint8Array};
export type RelationObject = RecordObject[];

interface ChartSpecBase {
  chartType: ChartType;
  data?: RelationObject;
}

export type ChartSpec = TwoDimCartesianCoordSpec;

export interface TwoDimCartesianCoordSpec extends ChartSpecBase {
  xAttribute: string;
  yAttribute: string;
}

/**
 * stores information about what relations live in what sources
 * as well as how large a table is
 * should be table oriented...
 */
export enum DbType {
  Local = "Local",
  Worker = "Worker",
  Socket = "Socket"
}

export interface TableMetaData {
  dbId: DbIdType;
}

export enum ChartType {
  BarChart = "BarChart",
  Scatter = "Scatter",
  LineChart = "LineChart"
}
export enum CellStatus {
  Initial = "Initial",
  Committed = "Committed"
}

/**
 * keeping it as an independent object in case we want to keep track of user interactions?
 * -- though we should probably use DIEL to do that; thinka bout later..
 */
export interface AnnotationSpec extends TwoDimCartesianCoordSpec {
  semanticId: string;
  ast: SelectionUnit;
}

/**
 * hard coding for demo right now
 */
export interface AnnotedSelectionUnit {
  columnSelections: AnnotationSpec[];
  ast: SelectionUnit;
}

/**
 * For now derived cannot be interactable
 */
export enum CellType {
  Basic,
  Interactable,
  Derived,
}

/**
 * - these queries will be simple ones for now (at least for the demo #DEMOHACK)
 * - runtime queries will be versioned, and the annotation corresponds to the most recent
 * - the raw selection unit will be in the bigger AST, in public views
 * - once a query is made interactable, it cannot be edited in the cells anymore
 * - upon undo, the index moves, and if there is a new version created,
 *   the versions after will be deleted
 */
export interface RuntimeCell {
  cId: QueryId; // immutable
  cName: string; // user can change
  cType: CellType;
  // TODO: this will be good context for figuring out what the user is interested in
  // isHideen: boolean;
  versions: string[];
  currentVersionIdx: number;
  currentAnnotions: AnnotedSelectionUnit;
}


export enum DielRemoteAction {
  ConnectToDb = "ConnectToDb",
  GetResultsByPromise = "GetResultsByPromise",
  DefineRelations = "DefineRelations",
  UpdateRelation = "UpdateRelation",
  ShipRelation = "ShipRelation",
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

// this will be what's encoded in the id
interface DielRemoteMessageBase {
  remoteAction: DielRemoteAction;
  msgId?: number;
  lineage?: LogicalTimestep;
}


export interface RemoteGetResultsByPromiseMessage extends RemoteExecuteMessage {
  msgId: number;
}

export interface RemoteShipRelationMessage extends DielRemoteMessageBase {
  relationName: RelationIdType;
  dbId: DbIdType;
}

export interface RemoteOpenDbMessage extends DielRemoteMessageBase {
  dbName?: string;     // for socket
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