import { Column, JoinAst, RelationReference, ColumnSelection, InsertionClause, Drop, RelationSelection, CompositeSelectionUnit, OrderByAst, SelectionUnit, RawValues, GroupByAst } from "./sqlAstTypes";
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
  Void = "Void",
  String = "String",
  Number = "Number",
  TimeStamp = "TimeStamp",
  Boolean = "Boolean",
  Relation = "Relation",
  // this needs to be inferred in the next stage
  TBD = "TBD"
}

// made the design decision where the view is based on use
// not at specification time
// but keeping it just in case we need to differentiate in the future
export enum DerivedRelationType {
  View = "View",
  StaticTable = "StaticTable",
  // PublicView = "PublicView",
  // PrivateView = "PrivateView",
  Output = "Output",
}

// FIXME: decide on the name
export enum OriginalRelationType {
  Input = "Input",
  Table = "Table",
  ExistingAndImmutable = "ExistingAndImmutable",
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

// currently only support a single output
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

// export interface ExistingRelation extends RelationBase {
//   relationType: StaticRelationType;
//   columns: Column[];
//   serverInfo?: ServerConnection;
// }

// used for inputs and tables that are accessed by programs
export interface OriginalRelation extends RelationBase {
  relationType: OriginalRelationType;
  columns: Column[];
  copyFrom?: string; // this is used by templates
}

// TODO
export interface ServerConnection {
  serverName: string;
}

export type ForeignKey = {
  sourceColumn: string, targetRelation: string, targetColumn: string
};

// wow constraints are complicated
// they are not recursive though
// evaluating them will be a pain probably as well
// I wonder if there is a similar dataflow structure for constraints???
// also need to merge this with the column constraints later... ugh ugly
export interface RelationConstraints {
  relationNotNull: boolean;
  relationHasOneRow: boolean;
  primaryKey?: string[];
  notNull?: string[];
  uniques?: string[][]; // there could be multiple unique claueses
  exprChecks?: ExprAst[]; // these are actually on colunmn level, a bit weird here
  foreignKeys?: ForeignKey[];
  // the other parts are in columns.. ugh
}

export type ProgramSpec = RelationSelection | InsertionClause;

/**
 * If input is not specified, it's over all inputs.
 */
export type ProgramsIr = Map<string, ProgramSpec[]>;

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
  // inputs: OriginalRelation[];
  originalRelations: OriginalRelation[];
  // outputs: DerivedRelation[];
  views: DerivedRelation[];
  programs: ProgramsIr;
  inserts: InsertionClause[];
  drops: Drop[];
  crossfilters: CrossFilterIr[];
  udfTypes: UdfType[];
}

export function createEmptyDieAst() {
  const newAst: DielAst = {
    originalRelations: [],
    views: [],
    programs: new Map(),
    inserts: [],
    drops: [],
    crossfilters: [],
    udfTypes: [],
  };
  return newAst;
}

/**
 * currently include
 * - views for local/workers/remotes
 * - programs for shipping data
 *
 * future:
 * - indices
 * - caching
 */

export interface DielPhysicalExecution {
  workerToMain: Map<number, Set<string>>;
  mainToWorker: Map<string, Set<number>>;
  main: DielAst;
  workers: Map<number, DielAst>;
  remotes: Map<string, DielAst>;
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


export type ProgramsParserIr = {input: string, queries: ProgramSpec[]};

export type ExpressionValue = DielAst
  | OriginalRelation
  | DerivedRelation
  | ColumnSelection
  | ColumnSelection[]
  | Column
  | Column[]
  | OrderByAst
  | OrderByAst[]
  | CompositeSelectionUnit
  | RelationSelection
  | RelationConstraints
  | ProgramSpec[]
  | string
  | string[]
  | RawValues
  | ProgramsParserIr
  | CrossFilterIr
  | CrossFilterChartIr
  | JoinAst
  | GroupByAst
  | ExprValAst
  | ExprAst
  | ExprAst[]
  | RelationReference
  | SelectionUnit
  | InsertionClause
  | UdfType
  | TemplateVariableAssignmentUnit
  ;