import { generateSelectionUnit } from "../../compiler/codegen/codeGenSql";
import { GenerateUnitTestErrorLogger } from "../../lib/messages";
import { SelectionUnit } from "../../parser/sqlAstTypes";
import { ExprType } from "../../parser/exprAstTypes";
import { DataType } from "../../parser/dielAstTypes";

/**
 * stripped of space and lower cased
 */
function strip(s: string) {
  return s.replace(/\s|\n+/g, "").toLowerCase();
}

export function codeGenBasicSQLTest() {
  // take an ast and assert the output
  const columns = [{
    expr: {
      exprType: ExprType.Column,
      dataType: DataType.TBD,
      columnName: "aId",
      hasStar: false,
      relationName: "t1"
    },
    alias: "a"
  }];
  const ast: SelectionUnit = {
    derivedColumnSelections: columns,
    columnSelections: columns,
    baseRelation: {relationName: "t1"}
  };
  const sGen = generateSelectionUnit(ast);
  const refSolution = `select t1.aId as a from t1`;
  const logger = GenerateUnitTestErrorLogger("codeGenBasicSQLTest", refSolution);
  if (strip(sGen) !== strip(refSolution)) {
    logger(`Generated SQL is wrong. Expected ${refSolution}, but got ${sGen} instead`);
  }
}