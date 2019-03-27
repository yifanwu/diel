import { ExprAst, ExprValAst } from "./exprAstTypes";
import { LogInternalError } from "../lib/messages";
import { RelationIdType } from "../compiler/DielPhysicalExecution";

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

export enum RelationType {
  EventTable = "EventTable",
  // these are etables taht do not generate their own timesteps
  // their temporal relationships are managed by the queue
  // IntermediateEventTable = "IntermediateEventTable",
  EventView = "EventView",
  Table = "Table",
  DerivedTable = "DerivedTable",
  ExistingAndImmutable = "ExistingAndImmutable",
  View = "View",
  // StaticTable = "StaticTable",
  Output = "Output",
}

export enum StaticRelationType {
  Local = "Local",
  WebWorker = "WebWorker",
  Server = "Server"
}

export enum ProgramType {
  Udf = "Udf",
  Insert = "Insert",
  // YIFAN TODO TODAY implement drop/delete
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
    udf: "COUNT",
    type: DataType.Number
  },
  {
    udf: "MIN",
    type: DataType.Number
  },
  {
    udf: "MAX",
    type: DataType.Number
  },
  {
    udf: "SUM",
    type: DataType.Number
  },
  {
    udf: "/",
    type: DataType.Number
  },
  {
    udf: "*",
    type: DataType.Number
  },
  {
    udf: "+",
    type: DataType.Number
  },
  {
    udf: "-",
    type: DataType.Number
  },
  {
    udf: "ROUND",
    type: DataType.Number
  },
  {
    udf: "AVG",
    type: DataType.Number
  },
  {
    udf: "GROUP_CONCAT",
    type: DataType.String
  },
];

interface RelationBase {
  name: string;
  constraints?: RelationConstraints;
  relationType: RelationType;
}

export interface DerivedRelation extends RelationBase {
  selection: RelationSelection;
}

export interface OriginalRelation extends RelationBase {
  columns: Column[];
  copyFrom?: string; // this is used by templates
}

export type Relation = DerivedRelation | OriginalRelation;
export type Command = RelationSelection | InsertionClause | DropClause | DeleteClause;

export type ForeignKey = {
  sourceColumn: string, targetRelation: string, targetColumn: string
};

export interface RelationConstraints {
  relationNotNull: boolean;
  relationHasOneRow: boolean;
  primaryKey?: string[];
  notNull?: string[];
  uniques?: string[][]; // there could be multiple unique claueses
  exprChecks?: ExprAst[]; // these are actually on colunmn level, a bit weird here
  foreignKeys?: ForeignKey[];
  // the other parts are in columns, which are normalized in in the normalize constraints pass
}


/**
 * If input is not specified, i.e. "", it's over all inputs.
 */
export type ProgramsIr = Map<string, Command[]>;

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
  relations: Relation[]; // contains all relations, including table definitions, events, ouputs and views
  commands: Command[]; // contains select, insert, drop, and delete
  programs: ProgramsIr;
  crossfilters: CrossFilterIr[];
  udfTypes: UdfType[];
}

export function createEmptyDielAst() {
  const newAst: DielAst = {
    // originalRelations: [],
    relations: [],
    // views: [],
    programs: new Map(),
    // inserts: [],
    commands: [],
    // drops: []
    crossfilters: [],
    udfTypes: [],
  };
  return newAst;
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

export type ProgramsParserIr = {events: RelationIdType[], queries: Command[]};

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
  | Command[]
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


export interface ColumnSelection {
  expr: ExprAst; // the column name is subsumed by the ExprAst...
  alias?: string;
}

export interface Column {
  name: string;
  type: DataType;
  constraints?: ColumnConstraints;
  defaultValue?: ExprAst;
}


// note that the string would need to contain quotes itself...
// export interface DefaultValue {
//   dataType: DataType;
//   value: ;
// }

// currently a bit lazy about the default representation...
export interface ColumnConstraints {
  notNull: boolean;
  autoincrement: boolean;
  unique: boolean;
  primaryKey: boolean;
}

export enum JoinType {
  LeftOuter = "LeftOuter",
  Inner = "Inner",
  CROSS = "Cross"
}

export interface CompositeSelectionUnit {
  // sequence of unions and intersections; SQL does not allow parenthesis here, they can create subqueries though
  op: SetOperator;
  relation: SelectionUnit;
}

/**
 * NA is used fort he first relation
 */
export enum SetOperator {
  NA = "NA",
  UNION = "UNION",
  // UNIONALL = "UNIONALL",
  INTERSECT = "INTERSECT",
  // EXCEPT = "EXCEPT"
}

export enum AstType {
  Drop = "Drop",
  Delete = "Delete",
  Insert = "Insert",
  Join = "Join",
  RelationSelection = "RelationSelection"
}

interface AstBase {
  astType: AstType;
}

export type CompositeSelection = CompositeSelectionUnit[];

// ugh cannot be called selection because the DOM apparently is using this...
export interface RelationSelection extends AstBase {
  templateSpec?: TemplateVariableAssignments;
  compositeSelections: CompositeSelection;
}

/**
 * This is the meat of DIEL IR
 * - it is recursive
 * - derivedColumnSelections contains normalized selections
 *   (all selections have specified source relations)
 * - columns are derived types
 * - note that the original query is left intact, so that the
 *   user's original representation are kept as is.
 */
export interface SelectionUnit {
  // this is first filled in by getting rid of the stars
  // then it's filled by the type inference pass
  isDistinct?: boolean;
  derivedColumnSelections?: ColumnSelection[];
  // these are filled in the parsing step
  columnSelections: ColumnSelection[];
  baseRelation?: RelationReference;
  joinClauses?: JoinAst[];
  whereClause?: ExprAst;
  groupByClause?: GroupByAst;
  orderByClause?: OrderByAst[];
  limitClause?: ExprAst;
}

// NOTE for LUCIE: here is where latest is being marked
//   (the parsing logic is done in `generateAst.ts` already)
export interface RelationReference {
  relationName?: string;
  isLatest?: boolean;
  alias?: string;
  subquery?: RelationSelection;
}

/**
 * If there is a subquery, then use alias, otherwise use the original relation name
 * @param r relation reference
 */
export function getRelationReferenceName(r: RelationReference) {
  const n = r.subquery ? r.alias : r.relationName;
  if (!n) {
    LogInternalError(`RelationReference either does not have an alias or name:\n ${JSON.stringify(r)}`);
  }
  return n;
}

export interface JoinAst extends AstBase {
  templateSpec?: TemplateVariableAssignments;
  joinType: JoinType;
  relation: RelationReference;
  alias?: string;
  predicate?: ExprAst;
}

export type RawValues = (string|number|boolean)[];

/**
 * Insertion clause is either direct insertion of values
 *   or derived another view
 */
export interface InsertionClause extends AstBase {
  relation: string;
  columns: string[];
  selection?: RelationSelection;
  values?: RawValues;
}

export enum Order {
  ASC = "ASC",
  DESC = "DESC"
}

export interface GroupByAst {
  selections: ExprAst[];
  predicate?: ExprAst;
}

export interface OrderByAst {
  order: Order;
  selection: ExprAst;
}

export interface DropClause extends AstBase {
  relationName: string;
}

// LUCIE TODO: need to create this for the corresponding codeGenSQL file!
export interface DeleteClause extends AstBase {
  relationName: string;
  predicate?: ExprAst; // could be no predicate
}