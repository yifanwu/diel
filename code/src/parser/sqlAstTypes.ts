import { DataType } from "./dielAstTypes";

export interface Selection {
  // if no columnName it's a select all
  // if none it's a star
  columnName?: string;
  relationName?: string;
}

export interface Column {
  columnName: string;
  type: DataType;
  constraints?: ColumnConstraints;
}

export interface ColumnConstraints {
  notNull: boolean;
  unique: boolean;
  key: boolean;
}

// used for inputs and tables that are accessed by programs
export interface DynamicRelationIr {
  name: string;
  columns: Column[];
  query?: string;
  constraints?: string[];
}

// expression has to be a recursive dataype
export interface ExprFunAst {
  function: FunctionTypes;
  arguments: ExprAst;
  // to be annotated later
  type: DataType;
}

export type ExprAst = ExprFunAst | ExprBaseAst | RelationAst | Selection;

export type FunctionTypes = MathOp | CompareOp | CustomFunc;

export interface ExprBaseAst {
  value: string | number | boolean;
}

export interface CustomFunc {
  name: string;
  inputs: DataType[]; // it is ordered
  output: DataType;
}

export enum MathOp {
  ADD,
  SUB,
  MUL,
  DIV
}

export enum CompareOp {
  EQ,
  NE,
  GT,
  GTE,
  LT,
  LTE
}

export enum JoinType {
  LeftOuter = "LeftOuter",
  Inner = "Inner",
  CROSS = "Cross"
}

export interface Join {
  joinType: JoinType;
  relation: RelationAst;
  condition: ExprAst;
}

export interface RelationSpecAst {
  columns: Column[];
}

export interface RelationAst {
  selections: Selection[];
  joinQuery: JoinAst;
  whereQuery: string;
  groupByQuery: string;
  orderByQuery: string;
  limitQuery: string;
}

export interface JoinAst {
  // it's one of them
  relationByReference?: string;
  relation?: RelationAst;
  predicate: ExprAst;
}

export interface RelationReference {
  // alias to itself if it's not specified
  // this makes it easier to search, when type inferencing on the columns
  name: string;
  alias: string;
  columns: Column[];
}
export interface JoinClauseIr {
  relation: RelationReference;
  query: string;
}
