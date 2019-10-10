import { DependencyTree } from "../runtime/runtimeTypes";

export type DbIdType = number;
export type RelationNameType = string;
export type ColumnNameType = string;
export type LogicalTimestep = number;


// in the code base we make use of different types of NULLs
// this is an attempt to keep the flexibilities of nulls but also make programming more sane!
export type ToBeFilled<T> = T | undefined;
export type HasDefault<T> = T | undefined;
export type Optional<T> = T | undefined;
export type NotNeededForCompiledAst<T> = T | undefined;

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
  | DropClause
  | DeleteClause
  | string
  | string[]
  | RawValues
  | ProgramsParserIr
  | JoinAst
  | GroupByAst
  | ExprValAst
  | ExprStarAst
  | ExprAst
  | ExprAst[]
  | RelationReferenceDirect
  | RelationReferenceSubquery
  | SelectionUnit
  | InsertionClause
  | UdfType
  | TemplateVariableAssignmentUnit
  | null
  ;

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
}


// this is actually still not just SQL
// since we differentiate static and dynamic
// this is more an overloaded lable for the event processing system than the actual SQL logic itself.


export const enum RelationType {
  View = "View",
  Output = "Output",
  Table = "Table",
  EventTable = "EventTable",
  EventView = "EventView",
  DerivedTable = "DerivedTable",
  ExistingAndImmutable = "ExistingAndImmutable",
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

export const BuiltInColumnTyppes: BuiltInColumnType[] = [
  {
    column: "rowid",
    type: DielDataType.Number
  },
  {
    column: "timestep",
    type: DielDataType.Number
  },
  {
    column: "request_timestep",
    type: DielDataType.Number
  },
  {
    column: "timestamp",
    type: DielDataType.Number
  }
];

export const BuiltInUdfTypes: UdfType[] = [
  {
    udf: "DATETIME",
    type: DielDataType.TimeStamp,
  },
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

export enum RelationOrigin {
  User = "User",
  DerivedFromCaching = "DerivedFromCaching",
  DerivedFromMaterialization = "DerivedFromMaterialization"
}

interface RelationBase {
  rName: string;
  origin?: HasDefault<RelationOrigin>;
  replaces?: Optional<RelationNameType>;
  isReplaced?: HasDefault<boolean>;
  constraints?: Optional<RelationConstraints>;
  relationType: RelationType;
}

export interface DerivedRelation extends RelationBase {
  selection: RelationSelection;
  cachable?: HasDefault<boolean>;
  toMaterialize?: boolean;
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

// the other parts are in columns, which are normalized in in the normalize constraints pass
export interface RelationConstraints {
  relationNotNull?: HasDefault<boolean>;
  relationHasOneRow?: HasDefault<boolean>;
  primaryKey?: Optional<string[]>;
  notNull?: Optional<string[]>;
  // there could be multiple unique claueses
  uniques?: Optional<string[][]>;
  // these are actually on colunmn level, a bit weird here
  exprChecks?: Optional<ExprAst[]>;
  foreignKeys?: Optional<ForeignKey[]>;
}

export function NewRelationConstraints(): RelationConstraints {
  return {
    relationNotNull: false,
    relationHasOneRow: false,
    primaryKey: [],
    notNull: [],
    uniques: [],
    exprChecks: [],
    foreignKeys: []
  };
}


// export type ProgramsIrFinal = Map<string, Command[]>;

/**
 * If input is not specified, i.e. "", it's over all inputs.
 */
export type ProgramsIr = Map<RelationNameType, Command[]>;

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

// Note: a bit problematic to mix cells and relations


export interface DielAst {
  relations: Relation[]; // contains all relations, including table definitions, events, ouputs and views
  replacedRelations: Relation[];
  commands: Command[]; // contains select, insert, drop, and delete
  programs: ProgramsIr;
  udfTypes: UdfType[];
  depTree?: ToBeFilled<DependencyTree>;
}

export function createEmptyDielAst() {
  const newAst: DielAst = {
    relations: [],
    replacedRelations: [],
    programs: new Map(),
    commands: [],
    udfTypes: BuiltInUdfTypes,
    depTree: new Map()
  };
  return newAst;
}

// export interface CrossFilterChartIr {
//   chartName: string;
//   predicate: JoinAst;
//   selection: RelationSelection;
// }

export type ProgramsParserIr = {events: RelationNameType[], queries: Command[]};


export interface Column {
  cName: string;
  dataType?: ToBeFilled<DielDataType>;
  constraints?: Optional<ColumnConstraints>;
  defaultValue?: Optional<ExprAst>;
}

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
  Natural = "Natural",
  CROSS = "Cross"
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

// sequence of unions and intersections; SQL does not allow parenthesis here, they can create subqueries though
export interface CompositeSelectionUnit {
  op: SetOperator;
  relation: SelectionUnit;
}


export type CompositeSelection = CompositeSelectionUnit[];


// ugh cannot be called selection because the DOM apparently is using this...
export interface RelationSelection extends AstBase {
  templateSpec?: TemplateVariableAssignments;
  compositeSelections: CompositeSelection;
}

/**
 * a recursive data structure that is the meat of DIEL IR
 * derivedColumnSelections contains normalized selections
 *   - all selections have specified source relations
 *   - no more stars
 *   - then it's filled by the type inference pass
 */
export interface SelectionUnit {
  isDistinct?: HasDefault<boolean>;
  columnSelections?: NotNeededForCompiledAst<ColumnSelection[]>;
  derivedColumnSelections?: ToBeFilled<ColumnSelection[]>;
  baseRelation?: Optional<RelationReference>;
  joinClauses?: Optional<JoinAst[]>;
  whereClause?: Optional<ExprAst>;
  groupByClause?: Optional<GroupByAst>;
  orderByClause?: Optional<OrderByAst[]>;
  limitClause?: Optional<ExprAst>;
}

export interface ColumnSelection {
  expr: ExprAst; // the column name is subsumed by the ExprAst...
  alias?: ToBeFilled<string>;
}

export enum RelationReferenceType {
  Direct = "Direct",
  Subquery = "Subquery"
}

export type RelationReference = RelationReferenceDirect | RelationReferenceSubquery;

export interface RelationReferenceBase {
  relationReferenceType: RelationReferenceType;
  // reference's alias will be copied with relationName in the alias normalization pass.
  alias?: ToBeFilled<string>;
}

export interface RelationReferenceDirect extends RelationReferenceBase {
  relationName: ToBeFilled<string>;
  isLatest?: HasDefault<boolean>;
}

export interface RelationReferenceSubquery extends RelationReferenceBase {
  // Subquery must have the alias
  alias: string;
  subquery: RelationSelection;
  wasFromLatest?: HasDefault<boolean>; // keeps track
}


export interface JoinAst extends AstBase {
  templateSpec?: TemplateVariableAssignments;
  joinType: JoinType;
  relation: RelationReference;
  predicate?: Optional<ExprAst>;
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

export enum DropType {
  Table = "Table",
  View = "View",
  Trigger = "Trigger",
  Constraint = "Constraint",
  Index = "Index"
}

// FIXME: add drop for views as well
// and maybe constraints?
export interface DropClause extends AstBase {
  dropType: DropType;
  dropName: string;
}
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
  Star = "Star",
  Relation = "Relation",
  Parenthesis = "Parenthesis"
}

/**
 * note that the string names here are used directly to generate the SQL queries
 *   so change the names carefully..
 * must be all caps for some laziness reasons
 */
export enum BuiltInFunc {
  In = "IN",
  DateTime = "DATETIME",
  JulianDay = "JULIANDAY",
  Coalesce = "COALESCE",
  ValueIsNull = "IS NULL",
  // ValueIsNotNull = "NOT NULL",
  ValueIsNotNull = "IS NOT NULL",
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

export type ExprAst = ExprFunAst | ExprStarAst | ExprValAst | ExprColumnAst | ExprRelationAst | ExprParen;

export interface ExprBase {
  exprType: ExprType;
  dataType?: ToBeFilled<DielDataType>;
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

export interface ExprStarAst extends ExprBase {
  relationName?: Optional<string>;
}

// hm there might be multiple here...
export interface ExprColumnAst extends ExprBase {
  columnName: string; // might not be defined if has start
  relationName?: ToBeFilled<string>;
}

export interface ExprValAst extends ExprBase {
  dataType: DielDataType;
  value: string | number | boolean;
}

export interface CustomFunc {
  name: string;
}


export type SimpleColumn = {
  cName: string,
  dataType: DielDataType
};

export enum BuiltInColumn {
  TIMESTEP = "TIMESTEP",
  TIMESTAMP = "TIMESTAMP",
  REQUEST_TIMESTEP = "REQUEST_TIMESTEP"
}

export const BuiltInColumnDataTypes = new Map([
  [BuiltInColumn.TIMESTAMP.toString(), DielDataType.TimeStamp],
  [BuiltInColumn.TIMESTEP.toString(), DielDataType.Number],
  [BuiltInColumn.REQUEST_TIMESTEP.toString(), DielDataType.Number],
]);

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