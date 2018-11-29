import { DataType, TemplateVariableAssignments } from "./dielAstTypes";
import { ExprAst } from "./exprAstTypes";

export interface DirectColumnSelection {
  columnName: string;
  relationName?: string;
}

export interface SimpleColumSelection extends DirectColumnSelection {
  hasStar: boolean;
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
  notNull?: boolean;
  unique?: boolean;
  key?: boolean;
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
  NA,
  UNION,
  UNIONALL,
  INTERSECT,
  EXCEPT
}

export enum AstType {
  Insert,
  Join,
  RelationSelection
}

interface AstBase {
  astType: AstType;
}

// ugh cannot be called selection because the DOM apparently is using this...
export interface RelationSelection extends AstBase {
  templateSpec?: TemplateVariableAssignments;
  selections: CompositeSelectionUnit[];
}

// recursive!!!
export interface SelectionUnit {
  // this is first filled in by getting rid of the stars
  // then it's filled by the type inference pass
  columns?: Column[];
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

// it's a bit ugly to put here but better than turning everything into a class??
// maybe i should refactor later
export function getRelationReferenceName(r: RelationReference) {
  if (r.alias) {
    return r.alias;
  }
  return r.relationName;
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