import { DataType } from "./dielAstTypes";
import { ExprAst } from "./exprAstTypes";

export interface SimpleColumSelection {
  hasStar: boolean;
  columnName: string;
  relationName?: string;
}

export interface ColumnSelection {
  hasStar: boolean;
  relationName?: string;
  expr?: ExprAst; // the column name is subsumed by the ExprAst...
}

export interface Column {
  name: string;
  type: DataType;
  constraints?: ColumnConstraints;
}

export interface ColumnConstraints {
  notNull: boolean;
  unique: boolean;
  key: boolean;
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

export enum SetOperator {
  UNION,
  UNIONALL,
  INTERSECT,
  EXCEPT
}

// ugh cannot be called selection because the DOM apparently is using this...
export type RelationSelection = CompositeSelectionUnit[];

// recursive!!
export interface SelectionUnit {
  selections: ColumnSelection[];
  baseRelation: RelationReference;
  joinClauses?: JoinAst[];
  whereClause?: ExprAst;
  groupByClause?: ColumnSelection[];
  orderByClause?: OrderByAst[];
  limitClause?: ExprAst;
}

export interface RelationReference {
  relationName?: string;
  alias?: string;
  subquery?: RelationSelection;
}

export interface JoinAst {
  joinType: JoinType;
  relation: RelationReference;
  alias?: string;
  predicate: ExprAst;
}

export type rawValues = (string|number|boolean)[];

/**
 * Insertion clause is either direct insertion of values
 *   or derived another view
 */
export interface InsertionClause {
  relation: string;
  columns: string[];
  selection?: RelationSelection;
  values?: rawValues;
}

export enum Order {
  ASC,
  DESC
}

export interface OrderByAst {
  order: Order;
  selection: ColumnSelection;
}

export interface Drop {
  relationName: string;
}