import { Column, JoinAst, RelationReference, ColumnSelection, ColumnConstraints, InsertionClause, Drop, RelationSelection, CompositeSelectionUnit, OrderByAst, SelectionUnit } from "./sqlAstTypes";
import { ExprAst, ExprBaseAst } from "./exprAstTypes";

// must return all the possible types that the intermediate nodes can return
// for now it's just strings; can add to later

export enum DataType {
  String = "String",
  Number = "Number",
  Boolean = "Boolean",
  // this needs to be inferred in the next stage
  TBD = "TBD"
}
export enum DerivedRelationType {
  PublicView = "PublicView",
  PrivateView = "PrivateView",
  Output = "Output",
}

export enum DynamicRelationType {
  Input = "Input",
  DynamicTable = "DynamicTable",
}

export enum StaticRelationType {
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


export interface RelationConstraints {
  viewConstraints: ViewConstraints;
  columnConstraints: ColumnConstraints[];
}

interface RelationBase {
  name: string;
  constraints?: RelationConstraints;
}

export interface DerivedRelation extends RelationBase {
  relationType: DerivedRelationType;
  selection: RelationSelection;
}

export interface ExistingRelation extends RelationBase {
  relationType: StaticRelationType;
  columns: Column[];
  serverInfo?: ServerConnection;
}

// used for inputs and tables that are accessed by programs
export interface DynamicRelation extends RelationBase {
  relationType: DynamicRelationType;
  columns: Column[];
}

// TODO
export interface ServerConnection {
  serverName: string;
}

export interface ViewConstraints {
  isNullable: boolean;
  isSingle: boolean;
}

export interface ProgramSpec {
  selectPrograms: ColumnSelection[];
  insertPrograms: InsertionClause[];
}

export interface ProgramsIr extends ProgramSpec {
  input: string;
}

export interface DielConfig {
  name?: string;
  existingDbPath?: string;
  loggingLevel?: string;
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
  inputs: DynamicRelation[];
  dynamicTables: DynamicRelation[];
  staticTables: ExistingRelation[];
  outputs: DerivedRelation[];
  views: DerivedRelation[];
  programs: ProgramsIr[];
  inserts: InsertionClause[];
  drops: Drop[];
  crossfilters: CrossFilterIr[];
  udfTypes: UdfType[];
  config?: DielConfig;
}

export interface CrossFilterChartIr {
  chartName: string;
  predicate: JoinAst;
  denormalizedRelation: string;
}

export interface CrossFilterIr {
  crossfilter: string;
  relation: string;
  charts: CrossFilterChartIr[];
}


export type ExpressionValue = DielAst
  | DynamicRelation
  | DerivedRelation
  | ExistingRelation
  | ColumnSelection
  | ColumnSelection[]
  | Column
  | OrderByAst[]
  | CompositeSelectionUnit
  | RelationSelection
  | RelationConstraints
  | ProgramSpec
  | string
  | string[]
  | ProgramsIr
  | CrossFilterIr
  | CrossFilterChartIr
  | JoinAst
  | ExprBaseAst
  | ExprAst
  | ViewConstraints
  | RelationReference
  | SelectionUnit
  | InsertionClause
  | UdfType
  ;