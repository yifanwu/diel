import { generateSelectionUnit } from "../../compiler/codegen/codeGenSql";
import { GenerateUnitTestErrorLogger } from "../../lib/messages";
import { SelectionUnit, JoinType, AstType } from "../../parser/sqlAstTypes";
import { ExprType, FunctionType } from "../../parser/exprAstTypes";
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
  },
  {
    expr: {
      exprType: ExprType.Column,
      dataType: DataType.TBD,
      columnName: "",
      hasStar: true,
      relationName: "t2"
    }
  }
  ];
  const predicate = {
    exprType: ExprType.Func,
    dataType: DataType.Boolean,
    functionType: FunctionType.Compare,
    functionReference: "=",
    args: [
      {
        exprType: ExprType.Column,
        dataType: DataType.TBD,
        columnName: "aId",
        hasStar: false,
        relationName: "t1"
      },
      {
        exprType: ExprType.Column,
        dataType: DataType.TBD,
        columnName: "aId",
        hasStar: false,
        relationName: "t2"
      }
    ]
  };
  const ast: SelectionUnit = {
    derivedColumnSelections: columns,
    columnSelections: columns,
    baseRelation: {relationName: "t1"},
    joinClauses: [{
      astType: AstType.Join,
      joinType: JoinType.LeftOuter,
      relation: {relationName: "t2"},
      predicate
    }]
  };
  const sGen = generateSelectionUnit(ast);
  const refSolution = `select t1.aId as a, t2.* from t1 LEFT OUTER join t2 on t1.aId = t2.aId`;
  const logger = GenerateUnitTestErrorLogger("codeGenBasicSQLTest", refSolution);
  if (strip(sGen) !== strip(refSolution)) {
    logger(`Generated SQL is wrong. Expected ${refSolution}, but got ${sGen} instead`);
  }
}