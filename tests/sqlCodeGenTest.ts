import { SqlStrFromSelectionUnit } from "../src/compiler/codegen/codeGenSql";
import { ExprType, FunctionType, DielDataType, SelectionUnit, JoinType, AstType, RelationReferenceType } from "../src/parser/dielAstTypes";
import { GenerateUnitTestErrorLogger } from "./testHelper";

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
      columnName: "aId",
      hasStar: false,
      relationName: "t1"
    },
    alias: "a"
  },
  {
    expr: {
      exprType: ExprType.Column,
      columnName: "",
      hasStar: true,
      relationName: "t2"
    }
  }
  ];
  const predicate = {
    exprType: ExprType.Func,
    dataType: DielDataType.Boolean,
    functionType: FunctionType.Compare,
    functionReference: "=",
    args: [
      {
        exprType: ExprType.Column,
        columnName: "aId",
        hasStar: false,
        relationName: "t1"
      },
      {
        exprType: ExprType.Column,
        columnName: "aId",
        hasStar: false,
        relationName: "t2"
      }
    ]
  };
  const ast: SelectionUnit = {
    derivedColumnSelections: columns,
    columnSelections: columns,
    baseRelation: {
      relationReferenceType: RelationReferenceType.Direct,
      relationName: "t1"
    },
    joinClauses: [{
      astType: AstType.Join,
      joinType: JoinType.LeftOuter,
      relation: {
        relationReferenceType: RelationReferenceType.Direct,
        relationName: "t2"
      },
      predicate
    }]
  };
  const sGen = SqlStrFromSelectionUnit(ast);
  const refSolution = `select t1.aId as a, t2.* from t1 LEFT OUTER join t2 on t1.aId = t2.aId`;
  const logger = GenerateUnitTestErrorLogger("codeGenBasicSQLTest", refSolution);
  if (strip(sGen) !== strip(refSolution)) {
    logger.error(`Generated SQL is wrong. Expected ${refSolution}, but got ${sGen} instead`);
  }
}