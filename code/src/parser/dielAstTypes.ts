import { Column, JoinAst, RelationReference, ColumnSelection, InsertionClause, Drop, RelationSelection, CompositeSelectionUnit, OrderByAst, SelectionUnit, RawValues } from "./sqlAstTypes";
import { ExprAst, ExprValAst } from "./exprAstTypes";

export interface DielTemplate {
  variables: string[];
  ast: JoinAst | RelationSelection;
}

export type TemplateVariableAssignments = Map<string, string>;

export interface TemplateVariableAssignmentUnit {
  variable: string;
  assignment: string;
}

export enum DataType {
  String = "String",
  Number = "Number",
  Boolean = "Boolean",
  Relation = "Relation",
  // this needs to be inferred in the next stage
  TBD = "TBD"
}

export enum DerivedRelationType {
  StaticTable = "StaticTable",
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
  copyFrom?: string;
}

// TODO
export interface ServerConnection {
  serverName: string;
}

// wow constraints are complicated
// they are not recursive though
// evaluating them will be a pain probably as well
// I wonder if there is a similar dataflow structure for constraints???
// also need to merge this with the column constraints later... ugh ugly
export interface RelationConstraints {
  relationNotNull: boolean;
  relationHasOneRow: boolean;
  primaryKeys?: string[];
  notNull?: string[];
  uniques?: string[][]; // there could be multiple unique claueses
  exprChecks?: ExprAst[]; // these are actually on colunmn level, a bit weird here
  // the other parts are in columns.. ugh
}

export type ProgramSpec = RelationSelection | InsertionClause;

/**
 * If input is not specified, it's over all inputs.
 */
export interface ProgramsIr {
  input?: string;
  queries: ProgramSpec[];
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
  selection: RelationSelection;
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
  | Column[]
  | OrderByAst[]
  | CompositeSelectionUnit
  | RelationSelection
  | RelationConstraints
  | ProgramSpec[]
  | string
  | string[]
  | RawValues
  | ProgramsIr
  | CrossFilterIr
  | CrossFilterChartIr
  | JoinAst
  | ExprValAst
  | ExprAst
  | RelationReference
  | SelectionUnit
  | InsertionClause
  | UdfType
  | TemplateVariableAssignmentUnit
  ;