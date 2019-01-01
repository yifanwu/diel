import { AnnotedSelectionUnit, AnnotateColumnSelection, RuntimeColumnSelectionInfo } from "./runtimeTypes";
import { SelectionUnit } from "../parser/sqlAstTypes";
import { ExprColumnAst, ExprType, FunctionType } from "../parser/exprAstTypes";
import { DataType } from "../parser/dielAstTypes";

/**
 * TODO: unclear what the interactions with the stars are for now...
 * for now do the simple binning #FIXME
 * @param ast
 */
export function getSelectionUnitAnnotation(ast: SelectionUnit): AnnotedSelectionUnit {
  const columnSelections: AnnotateColumnSelection[] = ast.derivedColumnSelections.map(s => {
    // just gonna do the group by for now
    // and just gonna do derived directy
    // a shallow copy is enough, but a little brittle since the object might become deep...
    const ast: SelectionUnit = {
      derivedColumnSelections: [{
        expr: Object.assign({}, s.expr),
        alias: "x"
      },
      {
        expr: {
          exprType: ExprType.Func,
          dataType: DataType.Number,
          functionType: FunctionType.BuiltIn,
          functionReference: "count",
          args: [Object.assign({}, s.expr)]
        },
        alias: "y"
      }],
      columnSelections: null,
      baseRelation: {
        relationName: (s.expr as ExprColumnAst).relationName
      },
      groupByClause: [{
        expr: Object.assign({}, s.expr),
      }]
    };
    const rtSelectionUnit: RuntimeColumnSelectionInfo = {
      ast
    };
    return {
      rtSelectionUnit
    };
  });
  return {
    columnSelections
  };
}