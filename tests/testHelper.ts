import { ExprAst, ExprType, ExprFunAst, ExprColumnAst, ExprValAst } from "../src/parser/dielAstTypes";
import { TestLogger } from "./testTypes";
import { BgYellow, Reset, FgRed, FgGreen } from "../src/util/messages";

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

export function GenerateUnitTestErrorLogger(testName: string, q?: string): TestLogger {
  console.log(`=================================\n
  ${BgYellow}Starting Test: %s${Reset}\n`, testName);
  if (q) console.log(`With query:\n%s`, q);
  return {
    error: (m: string, obj?: any) => {
      console.log(`\n ${FgRed}Error for [${testName}]: %s${Reset}`, m, obj);
      throw new Error(`Test [${testName}] failed\n`);
    },
    pass: () => {
      console.log(`${FgGreen}Test [${testName}] Passed :) \n================================${Reset}`);
    }
  };
}