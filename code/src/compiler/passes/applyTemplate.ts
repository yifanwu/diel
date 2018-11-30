import { JoinAst, RelationSelection, CompositeSelectionUnit, ColumnSelection, OrderByAst, RelationReference, AstType } from "../../parser/sqlAstTypes";
import { LogInternalError, ReportDielUserError } from "../../lib/messages";
import { ExprAst, ExprType, ExprColumnAst, ExprFunAst, ExprRelationAst } from "../../parser/exprAstTypes";
import { DielAst, DynamicRelation } from "../../parser/dielAstTypes";

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
export function applyTemplates(ast: DielAst) {
  // note: i think the concat should be fine with modifying in place?
  ast.views.concat(ast.outputs).map(r => applyATemplate(r.selection));
  ast.crossfilters.map(x => {
    x.charts.map(c => {
      applyATemplate(c.predicate);
      applyATemplate(c.selection);
    });
  });

  // defined here since it needs to access the global definition
  function copyRelationSpec(r: DynamicRelation): void {
    if (r.copyFrom) {
      // make sure it's not copying from itself
      if (r.copyFrom === r.name) {
        ReportDielUserError(`You cannot copy ${r.name} from itself!`);
      }
      // find the relation
      const sourceRelation = ast.inputs.concat(ast.dynamicTables).filter(r => r.name === r.copyFrom);
      if (sourceRelation.length === 0) {
        ReportDielUserError(`The relation definition you are trying to copy from, ${r.copyFrom}, does not exist`);
      } else {
        r.columns = sourceRelation[0].columns;
      }
    }
  }
  // and the copy pass
  ast.inputs.concat(ast.dynamicTables).map(r => copyRelationSpec(r));
}

/**
 * modify in place
 * @param ast
 */
function applyATemplate(ast: RelationSelection | JoinAst): void {

  if (!ast.templateSpec) {
    LogInternalError(`Template variables not specified`);
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
    c.relationName = _changeString(c.relationName);
  }

  function _visitOrderByAst(c: OrderByAst) {
    c.selection.relationName = _changeString(c.selection.relationName);
  }

  function _visitExprAst(e: ExprAst) {
    if (e.exprType === ExprType.Column) {
      const c = e as ExprColumnAst;
      c.column.columnName = _changeString(c.column.columnName);
      c.column.relationName = _changeString(c.column.relationName);
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
    ast.relation.groupByClause.map(c => _visitColumnSelection(c));
    ast.relation.orderByClause.map(c => _visitOrderByAst(c));
    _visitExprAst(ast.relation.limitClause);
  }

  function _visitSelection(subAst: RelationSelection) {
    subAst.compositeSelections.map(s => _visitCompositeSelectionUnit(s));
  }
}