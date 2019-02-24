import { DielIr, SimpleColumn, SelectionUnitVisitorFunctionOptions } from "../DielIr";
import { SelectionUnit, ColumnSelection, getRelationReferenceName, RelationReference } from "../../parser/sqlAstTypes";
import { ReportDielUserError, LogInternalError } from "../../lib/messages";
import { ExprType, ExprColumnAst, ExprFunAst } from "../../parser/exprAstTypes";
import { DataType } from "../../parser/dielAstTypes";
import { copyColumnSelection, createColumnSectionFromRelationReference } from "./helper";

/**
 * the pass removes the .* as well as filling in where the columns comes from if it's not specified
 * - visit by topological order
 * - supports subqueries, e.g., select k.* from (select * from t1) k;
 */
export function NormalizeColumnSelection(ir: DielIr) {
  ir.ApplyToImmediateSelectionUnits(normalizeColumnForSelectionUnit, true);
}

function columnsFromSelectionUnit(su: SelectionUnit): SimpleColumn[] {
  return su.derivedColumnSelections.map(cs => {
    if (cs.expr.exprType === ExprType.Column) {
      const columnExpr = cs.expr as ExprColumnAst;
      return {
        columnName: cs.alias ? cs.alias : columnExpr.columnName,
        type: columnExpr.dataType
      };
    } else {
      const functionExpr = cs.expr as ExprFunAst;
      return {
        columnName: cs.alias,
        type: functionExpr.dataType
      };
    }
  });
}

function columnsFromRelationName(ir: DielIr, relationName: string): SimpleColumn[] {
  const derived = ir.allCompositeSelections.get(relationName);
  if (derived) {
    return columnsFromSelectionUnit(derived[0].relation);
  }
  const original = ir.allOriginalRelations.get(relationName);
  if (original) {
    return original.columns.map(c => ({columnName: c.name, type: c.type}));
  }
  LogInternalError(`Cannot find relation ${relationName}`);
}

function columnsFromRelationReference(ir: DielIr, ref: RelationReference, refName?: string): SimpleColumn[] {
  if (refName && !((ref.alias === refName) || (ref.relationName === refName))) {
    return null;
  }
  if (ref.subquery) {
    // need to call normalization first...
    const newSelUnit = ref.subquery.compositeSelections[0].relation;
    normalizeColumnForSelectionUnit(newSelUnit, {ir});
    return columnsFromSelectionUnit(newSelUnit);
  } else {
    return columnsFromRelationName(ir, ref.relationName);
  }
}

function columnsFromLocalSelectionUnit(ir: DielIr, s: SelectionUnit, refName: string): SimpleColumn[] {
  const baseResult = columnsFromRelationReference(ir, s.baseRelation, refName);
  if (!baseResult) {
    // in joinClause
    for (let i = 0; i < s.joinClauses.length; i ++) {
      const joinRef = s.joinClauses[i];
      const joinResult = columnsFromRelationReference(ir, joinRef.relation, refName);
      if (joinResult) {
        return joinResult;
      }
    }
  } else {
    return baseResult;
  }
  ReportDielUserError(`Relation not defined`);
}

function starCase(ir: DielIr, s: SelectionUnit, currentColumnExpr: ExprColumnAst) {
    // both of the following options will need to append to the selections
    if (currentColumnExpr.relationName) {
      // case 1: find the columns of just the relations specified
      const populatedColumns = columnsFromLocalSelectionUnit(ir, s, currentColumnExpr.relationName)
        .map(newColumn => ({
          expr: {
            exprType: ExprType.Column,
            dataType: newColumn.type,
            hasStar: false,
            columnName: newColumn.columnName,
            relationName: currentColumnExpr.relationName
          },
          // cannot alias stars
          alias: null,
        }));
      return populatedColumns;
    } else {
      // case 2: find all the relations
      const populatedColumnsFromBase: ColumnSelection[] = columnsFromRelationReference(ir, s.baseRelation)
        .map(newColumn => ({
          expr: {
            exprType: ExprType.Column,
            dataType: newColumn.type,
            hasStar: false,
            columnName: newColumn.columnName,
            relationName: getRelationReferenceName(s.baseRelation)
          },
          // cannot alias stars
          alias: null
        }));
      let populatedColumnsFromJoins: ColumnSelection[] = [];
      s.joinClauses.map(j => {
        const relationName = getRelationReferenceName(j.relation);
        const newColumns: ColumnSelection[] = columnsFromRelationReference(ir, j.relation).map(c => ({
          expr: {
            exprType: ExprType.Column,
            dataType: DataType.TBD,
            hasStar: false,
            columnName: c.columnName,
            relationName: relationName,
          },
          alias: null
        }));
        populatedColumnsFromJoins.push(...newColumns);
      });
      return populatedColumnsFromBase.concat(populatedColumnsFromJoins);
    }
}

function normalizeColumnForSelectionUnit(s: SelectionUnit, optional: SelectionUnitVisitorFunctionOptions) {
    const derivedColumnSelections: ColumnSelection[][] = s.columnSelections.map(c => {
      if (c.expr.exprType === ExprType.Column) {
        const currentColumnExpr = c.expr as ExprColumnAst;
        if (currentColumnExpr.hasStar) {
          return starCase(optional.ir, s, currentColumnExpr);
        } else if (currentColumnExpr.relationName) {
          // not need to change; copy the column
          return [copyColumnSelection(c)];
        } else {
          // TODO: the relation needs to be found and copied in!
          // FIND the relation!
          // NOTE: not going to handle unnamed temporary relation for now, e.g.
          // `select a from (select a from t1);`
          // case 1: relation is in baserelation
          const columnsFrombaseSelection = columnsFromRelationReference(optional.ir, s.baseRelation);
          const foundFrombase = columnsFrombaseSelection.filter(cBase => cBase.columnName === currentColumnExpr.columnName);
          if (foundFrombase.length > 0) {
            // FIXME: this assumption will break when the relation is temporarily defined
            return [createColumnSectionFromRelationReference(c, foundFrombase[0], s.baseRelation.relationName)];
          }
        }
      } else {
        // this as to be a function
        if (c.expr.exprType !== ExprType.Func) {
          ReportDielUserError(`selections must be columns or functions`);
        }
        // now add it to derived; copy by rendrence for now... #FIXME
        return [c];
      }
    });
    s.derivedColumnSelections = [].concat(...derivedColumnSelections);
    // TODO: in addition to just expanding this query we might be interested in systematically expanding all other subqueries in the future...
    return;
  }

