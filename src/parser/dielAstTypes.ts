export type DbIdType = number;
export type RelationIdType = string;
export type LogicalTimestep = number;

export interface DielTemplate {
  variables: string[];
  ast: JoinAst | RelationSelection;
}

export type TemplateVariableAssignments = Map<string, string>;

export interface TemplateVariableAssignmentUnit {
  variable: string;
  assignment: string;
}

export enum DielDataType {
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
  type: DielDataType;
}

interface BuiltInColumnType {
  column: string;
  type: DielDataType;
}

export const BuiltInColumns: BuiltInColumnType[] = [
  {
    column: "rowid",
    type: DielDataType.Number
  },
  {
    column: "timestep",
    type: DielDataType.Number
  },
  {
    column: "timestamp",
    type: DielDataType.Number
  }
];

export const BuiltInUdfTypes: UdfType[] = [
  {
    udf: "COUNT",
    type: DielDataType.Number
  },
  {
    udf: "MIN",
    type: DielDataType.Number
  },
  {
    udf: "MAX",
    type: DielDataType.Number
  },
  {
    udf: "SUM",
    type: DielDataType.Number
  },
  {
    udf: "/",
    type: DielDataType.Number
  },
  {
    udf: "*",
    type: DielDataType.Number
  },
  {
    udf: "+",
    type: DielDataType.Number
  },
  {
    udf: "-",
    type: DielDataType.Number
  },
  {
    udf: "ROUND",
    type: DielDataType.Number
  },
  {
    udf: "AVG",
    type: DielDataType.Number
  },
  {
    udf: "GROUP_CONCAT",
    type: DielDataType.String
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
  type: DielDataType;
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

// FIXME: add drop for views as well
// and maybe constraints?
export interface DropClause extends AstBase {
  relationName: string;
}

// LUCIE TODO: need to create this for the corresponding codeGenSQL file!
export interface DeleteClause extends AstBase {
  relationName: string;
  predicate?: ExprAst; // could be no predicate
}


/**
 * Notes
 * - expression has to be a recursive dataype
 * - we allow for sets in the Expr to make the set-oriented functions expressible.
 */

export enum ExprType {
  Func = "Func",
  Val = "Val",
  Column = "Column",
  Relation = "Relation",
  Parenthesis = "Parenthesis"
}

export type ExprAst = ExprFunAst | ExprValAst | ExprColumnAst | ExprRelationAst | ExprParen;

export interface ExprBase {
  exprType: ExprType;
  dataType: DielDataType;
}

/**
 * note that the string names here are used directly to generate the SQL queries
 *   so change the names carefully..
 * must be all caps for some laziness reasons
 */
export enum BuiltInFunc {
  In = "IN",
  Coalesce = "COALESCE",
  ValueIsNull = "IS NULL",
  ValueIsNotNull = "NOT NULL",
  SetEmpty = "NOT EXIST",
  SetNotEmpty = "EXIST",
  // specially parsed when SQL gen
  IfThisThen = "IFTHISTHEN",
  ConcatStrings = "CONCATSTRINGS"
}

export enum FunctionType {
  Math = "Math",
  Compare = "Compare",
  Logic = "Logic",
  BuiltIn = "BuiltIn",
  Custom = "Custom"
}

export interface ExprParen extends ExprBase {
  content: ExprAst;
}

export interface ExprRelationAst extends ExprBase {
  selection: RelationSelection;
}

export interface ExprFunAst extends ExprBase {
  functionType: FunctionType;
  functionReference: string;
  args: ExprAst[];
}

// hm there might be multiple here...
export interface ExprColumnAst extends ExprBase  {
  // column: SimpleColumSelection;
  columnName: string;
  hasStar: boolean;
  relationName?: string;
}

export interface ExprValAst extends ExprBase {
  value: string | number | boolean;
}

export interface CustomFunc {
  name: string;
}

// export enum MathOp {
//   ADD,
//   SUB,
//   MUL,
//   DIV
// }

// export enum CompareOp {
//   EQ,
//   NE,
//   GT,
//   GTE,
//   LT,
//   LTE
// }