import { DataType } from "./dielAstTypes";
import { ColumnSelection, SimpleColumSelection } from "./sqlAstTypes";

/**
 * Notes
 * * expression has to be a recursive dataype
 */
export type ExprAst = ExprFunAst | ExprValAst | ExprColumnAst;

export interface ExprBase {
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

// export const BuiltInFuncReference: Map<BuiltInFunc, string> = new Map([
//   [BuiltInFunc.ConcatStrings, "concat"],
//   [BuiltInFunc.ValueIsNull, ""]
// ]);

export enum FunctionType {
  Math,
  Compare,
  Logic,
  BuiltIn,
  Custom
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