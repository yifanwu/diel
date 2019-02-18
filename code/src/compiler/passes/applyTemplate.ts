import { JoinAst, RelationSelection, CompositeSelectionUnit, ColumnSelection, OrderByAst, RelationReference, AstType } from "../../parser/sqlAstTypes";
import { ReportDielUserError } from "../../lib/messages";
import { ExprAst, ExprType, ExprColumnAst, ExprFunAst, ExprRelationAst } from "../../parser/exprAstTypes";
import { OriginalRelation } from "../../parser/dielAstTypes";
import { DielIr } from "../DielIr";

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
export function applyTemplates(ir: DielIr) {
  // note: i think the concat should be fine with modifying in place?
  ir.GetViews().map(r => tryToApplyATemplate(r.selection));
  ir.ast.crossfilters.map(x => {
    x.charts.map(c => {
      tryToApplyATemplate(c.predicate);
      tryToApplyATemplate(c.selection);
    });
  });

  // defined here since it needs to access the global definition
  function copyRelationSpec(r: OriginalRelation): void {
    if (r.copyFrom) {
      // make sure it's not copying from itself
      if (r.copyFrom === r.name) {
        ReportDielUserError(`You cannot copy ${r.name} from itself!`);
      }
      // find the relation
      const sourceRelation = ir.GetDielDefinedOriginalRelation().filter(r => r.name === r.copyFrom);
      if (sourceRelation.length === 0) {
        ReportDielUserError(`The relation definition you are trying to copy from, ${r.copyFrom}, does not exist`);
      } else {
        r.columns = sourceRelation[0].columns;
      }
    }
  }
  // and the copy pass
  ir.GetDielDefinedOriginalRelation().map(r => copyRelationSpec(r));
}

/**
 * modify in place
 * @param ast
 */
function tryToApplyATemplate(ast: RelationSelection | JoinAst): void {

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

  function _changeString(inStr: string): string {
    if (!inStr) {
      return;
    }
    if ((inStr[0] !== "{") && (inStr[inStr.length - 1] !== "}")) {
      const varName = inStr.slice(1, inStr.length - 1);
      return ast.templateSpec.get(varName);
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
    if (e.exprType === ExprType.Column) {
      const c = e as ExprColumnAst;
      c.columnName = _changeString(c.columnName);
      c.relationName = _changeString(c.relationName);
    } else if (e.exprType === ExprType.Func) {
      const f = e as ExprFunAst;
      // recursive!
      f.args.map(a => _visitExprAst(a));
    } else if (e.exprType === ExprType.Relation) {
      const r = e as ExprRelationAst;
      // recursive!!
      _visitSelection(r.selection);
    }
  }

  function _visitRelationReference(r: RelationReference): void {
    r.relationName = _changeString(r.relationName);
    _visitSelection(r.subquery);
  }

  function _visitJoinAst(j: JoinAst): void {
    // no nested templates allowed
    if (j.templateSpec) {
      ReportDielUserError(`No nested templates allowed`);
    }
    _visitRelationReference(j.relation);
    _visitExprAst(j.predicate);
  }

  function _visitCompositeSelectionUnit(ast: CompositeSelectionUnit): void {
    ast.relation.columnSelections.map(c => _visitColumnSelection(c));
    _visitRelationReference(ast.relation.baseRelation);
    ast.relation.joinClauses.map(j => _visitJoinAst(j));
    _visitExprAst(ast.relation.whereClause);
    ast.relation.groupByClause.selections.map(c => _visitExprAst(c));
    if (ast.relation.groupByClause.predicate) {
      _visitExprAst(ast.relation.groupByClause.predicate);
    }
    ast.relation.orderByClause.map(c => _visitOrderByAst(c));
    _visitExprAst(ast.relation.limitClause);
  }

  function _visitSelection(subAst: RelationSelection) {
    subAst.compositeSelections.map(s => _visitCompositeSelectionUnit(s));
  }
}