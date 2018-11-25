import { DataType } from "./dielAstTypes";
import { ColumnSelection } from "./sqlAstTypes";

/**
 * Notes
 * * expression has to be a recursive dataype
 */
export type ExprAst = ExprFunAst | ExprValAst | ExprColumnAst;

export interface ExprBase {
  type: DataType;
}

export enum FunctionTypes {
  Math,
  Compare,
  Custom
}

export interface ExprFunAst extends ExprBase {
  function: FunctionTypes;
  functionReference: string;
  arguments: ExprAst[];
}

export interface ExprColumnAst extends ExprBase  {
  column: ColumnSelection;
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