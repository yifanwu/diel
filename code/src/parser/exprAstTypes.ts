import { DataType } from "./dielAstTypes";
import { ColumnSelection, SimpleColumSelection, RelationSelection } from "./sqlAstTypes";

/**
 * Notes
 * - expression has to be a recursive dataype
 * - we allow for sets in the Expr to make the set-oriented functions expressible.
 */

export enum ExprType {
  Func,
  Val,
  Column,
  Relation,
  Parenthesis
}

export type ExprAst = ExprFunAst | ExprValAst | ExprColumnAst | ExprRelationAst | ExprParen;

export interface ExprBase {
  exprType: ExprType;
  dataType: DataType;
}

export enum BuiltInFunc {
  ConcatStrings = "ConcatStrings",
  ValueIsNull = "ValueIsNull",
  ValueIsNotNull = "ValueIsNotNull",
  SetEmpty = "SetEmpty",
  SetNotEmpty = "SetNotEmpty",
  IfThisThen = "IfThisThen"
}

export enum FunctionType {
  Math,
  Compare,
  Logic,
  BuiltIn,
  Custom
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
  column: SimpleColumSelection;
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