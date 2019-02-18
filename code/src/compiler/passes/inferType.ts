import { DielIr, SelectionUnitVisitorFunctionOptions } from "../DielIr";
import { LogInternalError } from "../../lib/messages";
import { DataType, BuiltInColumns } from "../../parser/dielAstTypes";
import { ExprType, ExprFunAst, ExprColumnAst, ExprAst } from "../../parser/exprAstTypes";
import { SelectionUnit } from "../../parser/sqlAstTypes";

export function InferType(ir: DielIr) {
  ir.ApplyToAllSelectionUnits(inferTypeForSelection, true);
}

function inferTypeForSelection(r: SelectionUnit, optional: SelectionUnitVisitorFunctionOptions) {
  r.derivedColumnSelections.map(cs => {
    if (!cs.expr) {
      LogInternalError(`the selection must have been parsed`);
    }
    if (!cs.expr.dataType) {
      LogInternalError(`derivedColumnSelections should be defined`);
    }
    if (cs.expr.dataType === DataType.TBD) {
      cs.expr.dataType = getTypeForColumnSelection(optional.ir, cs.expr, r);
    }
  });
}

function getTypeForColumnSelection(ir: DielIr, expr: ExprAst, r: SelectionUnit): DataType {
  if (expr.exprType === ExprType.Func) {
    // the functions should either be loaded into the compiler, or have their types specified via DIEL inputs
    // actually pretty hard to implement that reflection?
    // if selection, check what it's selected from
    const funExpr = expr as ExprFunAst;
    return ir.GetUdfType(funExpr.functionReference);
  } else if (expr.exprType === ExprType.Column) {
    const columnExpr = expr as ExprColumnAst;
    // make sure that the source is specified
    if (!columnExpr.relationName) {
      LogInternalError(`The normalization pass screwed up and did not specify the source relation for ${JSON.stringify(columnExpr)}`);
    }
    const cn = columnExpr.columnName;
    // case 1: check for keywords
    const special = BuiltInColumns.filter(sc => sc.column === cn)[0];
    if (special) {
      return special.type;
    }
    // map columnName to simple alias
    // first check base
    let deAliasedRelationname = columnExpr.relationName;
    if (r.baseRelation.alias && r.baseRelation.relationName && (columnExpr.relationName === r.baseRelation.alias)) {
      deAliasedRelationname = r.baseRelation.relationName;
    }
    // TODO: check for joins as well
    // directly see if it's found
    const existingType = ir.GetRelationColumnType(deAliasedRelationname, cn);
    // checking for subqueries
    if (!existingType) {
      // case 3: must be a temp table defined in a join or aliased
      // we need to access the scope of the current selection
      // TODO/FIXME: check base!
      // check joins
      for (let idx = 0; idx < r.joinClauses.length; idx ++) {
        const j = r.joinClauses[idx];
        // temp table can only be defined as alias...
        if (j.relation.alias === columnExpr.relationName) {
          // found it
          const tempRelation = j.relation.subquery.compositeSelections[0].relation;
          inferTypeForSelection(tempRelation, {ir});
          // now access it, should be fine...
          return ir.GetTypeFromDerivedRelationColumn(tempRelation, cn);
        }
      }
      throw new Error("Should have found a type by now!");
    } else {
      return existingType;
    }
  }
}