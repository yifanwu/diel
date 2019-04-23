import { LogInternalError, ReportDielUserError, DielInternalErrorType } from "../../util/messages";
import { DielDataType, BuiltInColumnTyppes, SelectionUnit, RelationReference, ExprType, ExprFunAst, ExprColumnAst, ExprAst, BuiltInFunc, ExprValAst, ExprParen, DerivedRelation, DielAst, RelationReferenceType, RelationReferenceSubquery, Relation, OriginalRelation, CompositeSelection, RelationReferenceDirect } from "../../parser/dielAstTypes";
import { GetRelationDef, IsRelationTypeDerived } from "../DielAstGetters";
import { WalkThroughSelectionUnits } from "../DielAstVisitors";

export function InferType(ast: DielAst) {
  WalkThroughSelectionUnits(ast, ((selection) => {
    _inferTypeForSelectionUnit(ast, selection);
  }));
}

export function InferTypeForDerivedRelation(ast: DielAst, view: DerivedRelation) {
  view.selection.compositeSelections.map(s => {
    _inferTypeForSelectionUnit(ast, s.relation);
  });
}

function _inferTypeForSelectionUnit(ast: DielAst, selection: SelectionUnit) {
  if (!selection.derivedColumnSelections) {
    LogInternalError(`Normalization pass of column selection should be defined before infer type is called! for derivedColumnSelections `);
  }

  selection.derivedColumnSelections.map(cs => {
    if (!cs.expr.dataType) {
      cs.expr.dataType = getTypeForExpr(ast, cs.expr, selection);
    }
  });
}

function getUdfType(ast: DielAst, sUnit: SelectionUnit, funName: string, expr: ExprFunAst): DielDataType | null {
  const normalizedName = funName.toLocaleUpperCase();
  switch (normalizedName) {
    case BuiltInFunc.Coalesce:
    case BuiltInFunc.IfThisThen:
      // 0 is the case clause, which is a boolean
      const firstExpr = expr.args[1];
      if (!firstExpr) {
        LogInternalError(`If else then should contain the if clause, but is missing: ${JSON.stringify(expr, null, 2)}`);
      }
      return getTypeForExpr(ast, firstExpr, sUnit);
    default:
      const r = ast.udfTypes.find(u => u.udf === normalizedName);
      if (!r) {
        return ReportDielUserError(`Type of ${funName} not defined. Original query is ${JSON.stringify(sUnit, null, 2)}.`);
      }
      return r.type;
  }
}

// recursive!
function getTypeForExpr(ast: DielAst, expr: ExprAst, sUnit: SelectionUnit): DielDataType | null {
  switch (expr.exprType) {
    case ExprType.Func:
      const funExpr = expr as ExprFunAst;
      return getUdfType(ast, sUnit, funExpr.functionReference, funExpr);
    case ExprType.Column:
      const columnExpr = expr as ExprColumnAst;
      const cn = columnExpr.columnName;
      // case 1: check for keywords
      const special = BuiltInColumnTyppes.filter(sc => sc.column === cn)[0];
      if (special) {
        return special.type;
      }
      // make sure that the source is specified
      if (!columnExpr.relationName) {
        return LogInternalError(`The normalization pass screwed up and did not specify the source relation for ${JSON.stringify(columnExpr)}`);
      }
      // case 2: see if its from the baseRelation
      if (sUnit.baseRelation) {
        if (columnExpr.relationName === sUnit.baseRelation.alias) {
          return getColumnTypeFromReference(ast, columnExpr.columnName, sUnit.baseRelation);
        }
        // case 3: see if its from the joins
        if (sUnit.joinClauses) {
          for (let i = 0; i < sUnit.joinClauses.length; i ++) {
            const j = sUnit.joinClauses[i];
            if (columnExpr.relationName === j.relation.alias) {
              return getColumnTypeFromReference(ast, columnExpr.columnName, sUnit.baseRelation);
            }
          }
        }
      }
      // FIXME: should pass some metadata for debugging
      debugger;
      ReportDielUserError(`type not found for column`);
    case ExprType.Parenthesis:
      const parenExpr = expr as ExprParen;
      // unpack
      return getTypeForExpr(ast, parenExpr.content, sUnit);
    case ExprType.Val:
      const valExpr = expr as ExprValAst;
      return valExpr.dataType;
    case ExprType.Star:
      return LogInternalError(`Should only invoke or normalized selections`);
    default:
      return LogInternalError(`Should have handled all cases`, DielInternalErrorType.UnionTypeNotAllHandled);
  }
}

function getColumnTypeFromCompositionSelection(s: CompositeSelection, columnName: string) {
  const selections = s[0].relation.derivedColumnSelections;
    if (!selections) return LogInternalError(`Should have done the normalization pass before this!`);
    for (let i = 0; i < selections.length; i ++) {
      const s = selections[i];
      if (columnName === s.alias) return s.expr.dataType;
    }
    return null;
}

// the two types are interchangeable for access purposes.
function getColumnTypeFromRelation(relation: Relation, columnName: string): DielDataType | null {
  // case 1: derived
  if (IsRelationTypeDerived(relation.relationType)) {
    return getColumnTypeFromCompositionSelection((relation as DerivedRelation).selection.compositeSelections, columnName);
  }
  // case 2: original
  const column = (relation as OriginalRelation).columns.filter(r => r.cName === columnName);
  if (column.length > 0) {
    return column[0].dataType;
  } else {
    return null;
  }
}

function getColumnTypeFromReference(ast: DielAst, columnName: string, ref: RelationReference): DielDataType | null {
  switch (ref.relationReferenceType) {
    case RelationReferenceType.Direct: {
      const r = ref as RelationReferenceDirect;
      // we need the original name, not alias!
      const rDef = GetRelationDef(ast, r.relationName);
      return getColumnTypeFromRelation(rDef, columnName);
    }
    case RelationReferenceType.Subquery: {
      const rDef = (ref as RelationReferenceSubquery).subquery.compositeSelections;
      return getColumnTypeFromCompositionSelection(rDef, columnName);
    }
    default:
      return LogInternalError(``);
  }
}
