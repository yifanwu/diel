import { DataType, TemplateVariableAssignments } from "./dielAstTypes";
import { ExprAst } from "./exprAstTypes";
import { LogInternalError } from "../lib/messages";

export interface ColumnSelection {
  expr: ExprAst; // the column name is subsumed by the ExprAst...
  alias?: string;
}

export interface Column {
  name: string;
  type: DataType;
  constraints?: ColumnConstraints;
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
  default?: string;
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