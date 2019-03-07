import { ExprAst, ExprValAst } from "./exprAstTypes";
import { LogInternalError } from "../lib/messages";

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
// export enum RelationType {
// }

// FIXME: decide on the name
export enum RelationType {
  EventTable = "EventTable",
  EventView = "EventView",
  Table = "Table",
  ExistingAndImmutable = "ExistingAndImmutable",
  View = "View",
  StaticTable = "StaticTable",
  Output = "Output",
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
    udf: "round",
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
  relationType: RelationType;
}

export interface DerivedRelation extends RelationBase {
  relationType: RelationType;
  selection: RelationSelection;
}

// export interface ExistingRelation extends RelationBase {
//   relationType: StaticRelationType;
//   columns: Column[];
//   serverInfo?: ServerConnection;
// }

// used for inputs and tables that are accessed by programs
export interface OriginalRelation extends RelationBase {
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

export function createEmptyDielAst() {
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
  notNull?: boolean;
  unique?: boolean;
  primaryKey?: boolean;
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
  UNIONALL = "UNIONALL",
  INTERSECT = "INTERSECT",
  EXCEPT = "EXCEPT"
}

export enum AstType {
  Insert = "INSERT",
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

export interface RelationReference {
  relationName?: string;
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

export interface Drop {
  relationName: string;
}