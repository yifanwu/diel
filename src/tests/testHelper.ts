import { ExprAst, ExprType, ExprFunAst, ExprColumnAst, ExprValAst } from "../parser/exprAstTypes";

// assert expression is a function
export function assertExprAsFunctionWithName(e: ExprAst, fName: string) {
  if (e.exprType !== ExprType.Func) {
    return false;
  }
  if ((<ExprFunAst>e).functionReference !== fName) {
    return false;
  }
  return true;
}


// assert expression is a number
// the any might be a bit brittle
export function assertValue(e: ExprAst, val: any) {
  if (e.exprType !== ExprType.Val) {
    return false;
  }
  if ((<ExprValAst>e).value !== val) {
    console.log(`got value ${val} instead`);
    return false;
  }
  return true;
}

// assert expression is a sepecific column and return arguments
export function assertExprAsColumnWithname(e: ExprAst, cName: string) {
  if (e.exprType !== ExprType.Column) {
    return false;
  }
  if ((<ExprColumnAst>e).columnName !== cName) {
    return false;
  }
  return true;
}
