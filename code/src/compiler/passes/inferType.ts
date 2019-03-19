import { DielIr, SelectionUnitVisitorFunctionOptions } from "../DielIr";
import { LogInternalError, ReportDielUserError } from "../../lib/messages";
import { DataType, BuiltInColumns, SelectionUnit, RelationReference } from "../../parser/dielAstTypes";
import { ExprType, ExprFunAst, ExprColumnAst, ExprAst, BuiltInFunc } from "../../parser/exprAstTypes";

export function InferType(ir: DielIr) {
  ir.ApplyToImmediateSelectionUnits(inferTypeForSelection, true);
}

// recurively invoked
// FIXME: the optional is kinda weird
export function inferTypeForSelection(r: SelectionUnit, optional: SelectionUnitVisitorFunctionOptions) {
  r.derivedColumnSelections.map(cs => {
    if (!cs.expr) {
      LogInternalError(`the selection must have been parsed`);
    }
    if (!cs.expr.dataType) {
      LogInternalError(`derivedColumnSelections should be defined`);
    }
    if (cs.expr.dataType === DataType.TBD) {
      cs.expr.dataType = getTypeForExpr(optional.ir, cs.expr, r);
    }
  });
}


function getUdfType(ir: DielIr, sUnit: SelectionUnit, funName: string, expr: ExprFunAst) {
  switch (funName.toLocaleUpperCase()) {
    case BuiltInFunc.Coalesce:
    case BuiltInFunc.IfThisThen:
      const firstExpr = expr.args[1];
      if (!firstExpr) {
        LogInternalError(`If else then should contain the if clause, but is missing: ${JSON.stringify(expr, null, 2)}`);
      }
      return getTypeForExpr(ir, firstExpr, sUnit);
    default:
      const r = ir.ast.udfTypes.find(u => u.udf === funName);
      if (!r) {
        ReportDielUserError(`Type of ${funName} not defined. Original query is ${JSON.stringify(sUnit, null, 2)}.`);
      }
      return r.type;
  }
}

function getTypeForExpr(ir: DielIr, expr: ExprAst, sUnit: SelectionUnit): DataType {
  if (expr.exprType === ExprType.Func) {
    const funExpr = expr as ExprFunAst;
    return getUdfType(ir, sUnit, funExpr.functionReference, funExpr);
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
    if (sUnit.baseRelation.alias && sUnit.baseRelation.relationName && (columnExpr.relationName === sUnit.baseRelation.alias)) {
      deAliasedRelationname = sUnit.baseRelation.relationName;
    }
    // TODO: check for joins as well
    // directly see if it's found
    const existingType = ir.GetRelationColumnType(deAliasedRelationname, cn);
    // checking for subqueries
    if (!existingType) {
      // case 3: must be a temp table defined in a join or aliased
      // we need to access the scope of the current selection
      const checkAlias = (rRef: RelationReference) => {
        if (rRef.alias === columnExpr.relationName) {
          // found it
          const tempRelation = rRef.subquery.compositeSelections[0].relation;
          inferTypeForSelection(tempRelation, {ir});
          // now access it, should be fine...
          return ir.GetTypeFromDerivedRelationColumn(tempRelation, cn);
        }
      };
      // first check base!
      const typeFromBase = checkAlias(sUnit.baseRelation);
      if (typeFromBase) {
        return typeFromBase;
      }
      // check joins
      for (let idx = 0; idx < sUnit.joinClauses.length; idx ++) {
        const j = sUnit.joinClauses[idx];
        // temp table can only be defined as alias...
        const typeFromJoin = checkAlias(j.relation);
        if (typeFromJoin) {
          return typeFromJoin;
        }
      }
      LogInternalError("Should have found a type by now!");
    } else {
      return existingType;
    }
  }
}