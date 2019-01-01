import { AnnotedSelectionUnit, AnnotateColumnSelection, RuntimeColumnSelectionInfo } from "./runtimeTypes";
import { SelectionUnit } from "../parser/sqlAstTypes";
import { ExprColumnAst } from "../parser/exprAstTypes";

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
      }],
      columnSelections: null,
      baseRelation: {
        relationName: (s.expr as ExprColumnAst).relationName
      }
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