import { DielIr, SimpleColumn, SelectionUnitVisitorFunctionOptions, BuiltInColumn, columnsFromSelectionUnit } from "../DielIr";
import { ReportDielUserError, LogInternalError } from "../../util/messages";
import { ExprType, ExprColumnAst } from "../../parser/exprAstTypes";
import {  SelectionUnit, ColumnSelection, getRelationReferenceName, RelationReference, DataType } from "../../parser/dielAstTypes";
import { copyColumnSelection, createColumnSectionFromRelationReference } from "./helper";
import { generateSelectionUnitBody } from "../codegen/codeGenSql";

/**
 * the pass removes the .* as well as filling in where the columns comes from if it's not specified
 * - visit by topological order
 * - supports subqueries, e.g., select k.* from (select * from t1) k;
 */
export function NormalizeColumnSelection(ir: DielIr) {
  ir.ApplyToImmediateSelectionUnits<void>(normalizeColumnForSelectionUnit, true);
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
    return ir.GetColumnsFromRelationName(ref.relationName);
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
  return ReportDielUserError(`Relation not defined`);
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

function normalizeColumnForSelectionUnit(s: SelectionUnit, optional: SelectionUnitVisitorFunctionOptions): void {
    const derivedColumnSelections: ColumnSelection[][] = s.columnSelections.map(c => {
      switch (c.expr.exprType) {
        case ExprType.Column:
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
          // UGH this is so ugly...
          if (currentColumnExpr.columnName.toUpperCase() === BuiltInColumn.TIMESTAMP) {
            // FIXME: check if base is input; too lazy for now
            return [createColumnSectionFromRelationReference(c, {columnName: currentColumnExpr.columnName, type: DataType.TimeStamp}, s.baseRelation.relationName)];
          }
          if (currentColumnExpr.columnName.toUpperCase() === BuiltInColumn.TIMESTEP) {
            // FIXME: check if base is input; too lazy for now
            return [createColumnSectionFromRelationReference(c, {columnName: currentColumnExpr.columnName, type: DataType.Number}, s.baseRelation.relationName)];
          }
          const columnsFrombaseSelection = columnsFromRelationReference(optional.ir, s.baseRelation);
          const foundFrombase = columnsFrombaseSelection.filter(cBase => cBase.columnName === currentColumnExpr.columnName);
          if (foundFrombase.length > 0) {
            // FIXME: this assumption will break when the relation is temporarily defined
            return [createColumnSectionFromRelationReference(c, foundFrombase[0], s.baseRelation.relationName)];
          } else {
            // the user should specify where the column is from if there are join cases (this is the assumption held by SQLite)
            // this might be a case where we could improve SQLite
            ReportDielUserError(`Column ${currentColumnExpr.columnName} is not found in ${s.baseRelation.relationName}. If it's specified in the join clause, please specify which relation the column is from.`, generateSelectionUnitBody(s));
          }
        }
        break;
      default:
        // might be slow? #FIXME
        return [JSON.parse(JSON.stringify(c))];
      }
      return LogInternalError(`Should have returned by now`);
    });
    s.derivedColumnSelections = [].concat(...derivedColumnSelections);
    // TODO: in addition to just expanding this query we might be interested in systematically expanding all other subqueries in the future...
    if (s.baseRelation.subquery) {
      normalizeColumnForSelectionUnit(s.baseRelation.subquery.compositeSelections[0].relation, optional);
    }
    // loop through the joins and find the subqueries
    s.joinClauses.map(j => {
      if (j.relation.subquery) {
        normalizeColumnForSelectionUnit(j.relation.subquery.compositeSelections[0].relation, optional);
      }
    });
    return;
  }

