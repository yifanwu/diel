import { ReportDielUserError, LogInternalWarning, LogInternalError, DielInternalErrorType } from "../../util/messages";
import { ExprAst, ExprType, ExprColumnAst, ExprFunAst, ExprRelationAst, OriginalRelation, JoinAst, RelationSelection, CompositeSelectionUnit, ColumnSelection, OrderByAst, RelationReference, AstType, DielAst, RelationReferenceType, RelationReferenceDirect, RelationReferenceSubquery  } from "../../parser/dielAstTypes";
import { GetAllDielDefinedOriginalRelations, GetAllDerivedViews } from "../DielAstGetters";

/**
 * Find all the top level selections for:
 * - views
 * - outputs
 *
 * Possibly also joins for
 * - crossfilters
 *
 * Do the copy pass for:
 * - inputs
 * - dynamicTables
 * @param ast diel ast
 */
export function ApplyTemplates(ast: DielAst) {
  // note: i think the concat should be fine with modifying in place?
  GetAllDerivedViews(ast).map(r => TryToApplyTemplate(r.selection));

  // defined here since it needs to access the global definition
  // and the copy pass
  GetAllDielDefinedOriginalRelations(ast).map(r => TryToCopyRelationSpec(ast, r));
}

export function TryToCopyRelationSpec(ast: DielAst, r: OriginalRelation): void {
  if (r.copyFrom) {
    // make sure it's not copying from itself
    if (r.copyFrom === r.rName) {
      ReportDielUserError(`You cannot copy ${r.rName} from itself!`);
    }
    // find the relation
    const sourceRelation = GetAllDielDefinedOriginalRelations(ast).filter(r => r.rName === r.copyFrom);
    if (sourceRelation.length === 0) {
      ReportDielUserError(`The relation definition you are trying to copy from, ${r.copyFrom}, does not exist`);
    } else {
      r.columns = sourceRelation[0].columns;
    }
  }
}

/**
 * modify in place
 * @param ast
 */
export function TryToApplyTemplate(ast: RelationSelection | JoinAst): void {

  if (!ast.templateSpec) {
    // there is no template to apply here!
    // LogInternalError(`Template variables not specified`);
    return;
  }

  if (ast.astType === AstType.RelationSelection) {
    _visitSelection(ast as RelationSelection);
  } else {
    _visitJoinAst(ast as JoinAst);
  }

  function _changeString(inStr: string | undefined): string | undefined {
    if (!inStr) {
      return inStr;
    }
    if ((inStr[0] === "{") && (inStr[inStr.length - 1] === "}")) {
      const varName = inStr.slice(1, inStr.length - 1);
      const varValue = ast.templateSpec!.get(varName);
      if (varValue) return varValue;
      LogInternalError(`${varName} was not found`);
      return undefined;
    } else {
      return inStr;
    }
  }

  function _visitColumnSelection(c: ColumnSelection) {
    // only change if it's a column
    // in theory this also needs to be recursive... but only deal with shallow stuff for now
    _visitExprAst(c.expr);
  }

  function _visitOrderByAst(c: OrderByAst) {
    _visitExprAst(c.selection);
  }

  function _visitExprAst(e: ExprAst) {
    if (e) {
      if (e.exprType === ExprType.Column) {
        const c = e as ExprColumnAst;
        const newCName = _changeString(c.columnName);
        if (newCName) c.columnName = newCName;
        const newRName = _changeString(c.relationName);
        if (newRName) c.relationName = newRName;
      } else if (e.exprType === ExprType.Func) {
        const f = e as ExprFunAst;
        // recursive!
        f.args.map(a => _visitExprAst(a));
      } else if (e.exprType === ExprType.Relation) {
        const r = e as ExprRelationAst;
        // recursive!!
        _visitSelection(r.selection);
      }
    } else {
      LogInternalError(`Visiting null`, DielInternalErrorType.ArgNull);
    }
  }

  function _visitRelationReference(ref: RelationReference): void {
    switch (ref.relationReferenceType) {
      case RelationReferenceType.Direct: {
        const r = ref as RelationReferenceDirect;
        r.relationName = _changeString(r.relationName);
        return;
      }
      case RelationReferenceType.Subquery: {
        const r = ref as RelationReferenceSubquery;
        if (r.subquery) _visitSelection(r.subquery);
        return;
      }
      default:
        LogInternalError(``);
        return;
    }
  }

  function _visitJoinAst(j: JoinAst): void {
    // no nested templates allowed
    if (j.templateSpec) {
      ReportDielUserError(`No nested templates allowed`);
    }
    _visitRelationReference(j.relation);
    if (j.predicate) _visitExprAst(j.predicate);
  }

  function _visitCompositeSelectionUnit(ast: CompositeSelectionUnit): void {
    ast.relation.columnSelections.map(c => _visitColumnSelection(c));
    if (ast.relation.baseRelation) _visitRelationReference(ast.relation.baseRelation);
    if (ast.relation.joinClauses) ast.relation.joinClauses.map(j => _visitJoinAst(j));
    if (ast.relation.whereClause) _visitExprAst(ast.relation.whereClause);
    if (ast.relation.groupByClause) {
      ast.relation.groupByClause.selections.map(c => _visitExprAst(c));
      if (ast.relation.groupByClause.predicate) {
        _visitExprAst(ast.relation.groupByClause.predicate);
      }
    }
    if (ast.relation.orderByClause) ast.relation.orderByClause.map(c => _visitOrderByAst(c));
    if (ast.relation.limitClause) _visitExprAst(ast.relation.limitClause);
  }

  function _visitSelection(subAst: RelationSelection) {
    if (subAst) {
      subAst.compositeSelections.map(s => _visitCompositeSelectionUnit(s));
    } else {
      LogInternalWarning(`Attempted to call __visitSelection on null`);
    }
  }
}