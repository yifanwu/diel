import { DynamicRelationIr, SelectQueryIr, Column, JoinClauseIr, SelectQueryPartialIr, SelectBodyIr, ExprAst, RelationReference } from "./sqlAstTypes";

// must return all the possible types that the intermediate nodes can return
// for now it's just strings; can add to later

export enum DataType {
  String = "String",
  Number = "Number",
  Boolean = "Boolean",
  // this needs to be inferred in the next stage
  TBD = "TBD"
}

export enum RelationType {
  Input = "Input",
  View = "View",
  StaticTable = "StaticTable",
  DynamicTable = "DynamicTable",
  Output = "Output",
  // this is when it is used as parts of a subquery
  SubQuery = "SubQuery"
}


export enum DielRemoteType {
  Local = "Local",
  WebWorker = "WebWorker",
  Server = "Server"
}

export enum ProgramType {
  Udf = "Udf",
  Insert = "Insert"
}

export enum LoggingLevels {
  Verbose = "Verbose",
  Succinct = "Succinct"
}

export interface TransferInfo {
  depViews: string;
  location: string;
}

export interface UdfType {
  udf: string;
  type: DataType;
}

interface BuiltInColumnType {
  column: string;
  type: DataType;
}

export const BuiltInColumns: BuiltInColumnType[] = [
  {
    column: "rowid",
    type: DataType.Number
  },
  {
    column: "timestep",
    type: DataType.Number
  },
  {
    column: "timestamp",
    type: DataType.Number
  }
];

export const BuiltInUdfTypes: UdfType[] = [
  {
    udf: "count",
    type: DataType.Number
  },
  {
    udf: "sum",
    type: DataType.Number
  },
  {
    udf: "avg",
    type: DataType.Number
  },
  {
    udf: "group_concat",
    type: DataType.String
  },
];

// only DIEL ones know
type: RelationType;


export interface StaticRelationIr extends DynamicRelationIr {
  remoteType: DielRemoteType;
  serverInfo?: ServerConnection;
}

// TODO
export interface ServerConnection {
  serverName: string;
}

export interface ViewConstraintsIr {
  isNullable: boolean;
  isSingle: boolean;
}

// used for views and outputs
export interface DerivedRelationIr extends SelectQueryIr, ViewConstraintsIr {
  name: string;
  isPublic?: boolean;
}

export interface InsertQueryIr {
  relation: string;
  query: string;
}

export interface ProgramSpecIr {
  selectPrograms: SelectQueryIr[];
  insertPrograms: InsertQueryIr[];
}

export interface ProgramsIr extends ProgramSpecIr {
  input: string;
}

export interface DielConfig {
  name?: string;
  existingDbPath?: string;
  loggingLevel?: string;
}

// type UndefinedName = "undefined";

export interface DielSummary {
  // this is for searching through relations and column definitions
  // during the error checking and type inference phase
  allRelations: {name: string, columns: Column};
}

// one need of context is to know whether it is in a program
// using null to overload whether it's defined or not
export interface DielContext {
  program?: {
    isGeneral: boolean;
    name?: string;
  };
}

export interface DielAst {
  inputs: DynamicRelationIr[];
  dynamicTables: DynamicRelationIr[];
  staticTables: StaticRelationIr[];
  outputs: DerivedRelationIr[];
  views: DerivedRelationIr[];
  programs: ProgramsIr[];
  inserts: InsertQueryIr[];
  drops: InsertQueryIr[];
  crossfilters: CrossFilterIr[];
  udfTypes: UdfType[];
  config?: DielConfig;
}



export interface CrossFilterChartIr {
  chartName: string;
  predicate: JoinClauseIr;
  definition: SelectQueryIr;
}

export interface CrossFilterIr {
  crossfilter: string;
  relation: string;
  charts: CrossFilterChartIr[];
}


export type ExpressionValue = DielAst | DynamicRelationIr | DerivedRelationIr | Column | SelectQueryIr | SelectQueryPartialIr | InsertQueryIr | InsertQueryIr[] | ProgramSpecIr | string | string[] | ProgramsIr | SelectBodyIr | CrossFilterIr | CrossFilterChartIr | JoinClauseIr | ExprAst | ViewConstraintsIr | RelationReference | UdfType;