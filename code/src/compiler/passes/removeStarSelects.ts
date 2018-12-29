import { DielAst, DataType } from "../../parser/dielAstTypes";
import { RelationSelection, SelectionUnit, RelationReference, Column, getRelationReferenceName, SimpleColumSelection } from "../../parser/sqlAstTypes";
import { ReportDielUserError, sanityAssert } from "../../lib/messages";
import { ExprColumnAst, ExprType } from "../../parser/exprAstTypes";
import { visitSelections } from "../dielVisitors";

// interface RelationColumns {
//   refName: string;
//   columns: Column[];
// }

/**
 * this pass removes the .* as well as filling in where the columns comes from if it's not specified
 *
 * - we need to keep track of subqueries, e.g., select k.* from (select * from t1) k;
 * the visitation order matters. We probably want to start with the leaves
 * can we do it such that we revursively do it --- like if it's not done, trigger the function again until it's done (is this why it's so fractal-ly???)
 */

export function normalizeColumnSelection(ast: DielAst): void {
  // similar structure
  visitSelections(ast, visitSelection);
  function visitSelection(r: RelationSelection): void {
    r.compositeSelections.map(s => visitSelectionUnit(s.relation));
  }

  // helper functions
  function findGolbalRelation(refName: string): Column[] {
    const dynamicResult = ast.inputs.concat(ast.dynamicTables).filter(r => r.name === refName);
    if (dynamicResult.length > 0) {
      return dynamicResult[0].columns;
    }
    // now check the other relations
    const staticResult = ast.outputs.concat(ast.views).filter(r => r.name === refName);
    if (staticResult.length > 0) {
      // there should really just be one?
      const staticResultUnitSelection = staticResult[0].selection.compositeSelections[0].relation;
      if (!staticResultUnitSelection.columns) {
        // recursive!
        visitSelectionUnit(staticResultUnitSelection);
      }
    }
    return null;
  }

  function getColumnsFromRelationReference(ref: RelationReference, refName?: string): Column[] {
    if (refName && !((ref.alias === refName) || (ref.relationName === refName))) {
      return null;
    }
    if (ref.subquery) {
      const refRelation = ref.subquery.compositeSelections[0].relation;
      if (!refRelation.columns) {
        // recursive!
        visitSelectionUnit(refRelation);
      }
      return refRelation.columns;
    } else {
      return findGolbalRelation(ref.relationName);
    }
  }
  function findLocalRelation(s: SelectionUnit, refName: string): Column[] {

    const baseResult = getColumnsFromRelationReference(s.baseRelation, refName);
    if (!baseResult) {
      // in joinClause
      for (let i = 0; i < s.joinClauses.length; i ++) {
        const joinRef = s.joinClauses[i];
        const joinResult = getColumnsFromRelationReference(joinRef.relation, refName);
        if (joinResult) {
          return joinResult;
        }
      }
    } else {
      return baseResult;
    }
    ReportDielUserError(`Relation not defined`);
  }

  function createExprColumn(cols: Column[], relation: string): ExprColumnAst[] {
    return cols.map(c => ({
      exprType: ExprType.Column,
      dataType: DataType.TBD,
      column: {
        hasStar: false,
        columnName: c.name,
        relationName: relation,
      }
    }));
  }

  function findColumn(currentColumn: SimpleColumSelection, relation: RelationReference) {
    const columns = getColumnsFromRelationReference(relation);
    if (columns) {
      if (columns.find(searchColumn => searchColumn.name === currentColumn.columnName)) {
        currentColumn.relationName = getRelationReferenceName(relation);
        return true;
      }
    }
    return false;
  }

  function visitSelectionUnit(s: SelectionUnit): void {
    // the body of the function
    const columnSet = s.columnSelections.map(c => {
      // this is the star part
      if (c.hasStar) {
        if (c.relationName) {
          // find the relation
          const foundRelation = findLocalRelation(s, c.relationName);
          if (!foundRelation) {
            ReportDielUserError(`Relation not defined`);
          }
          // now replace and set hasStar to false
          // create new ExprColumnAst for all the columsn
          const populatedColumns: ExprColumnAst[] = foundRelation.map(newColumn => ({
            exprType: ExprType.Column,
            dataType: newColumn.type,
            column: {
              hasStar: false,
              columnName: newColumn.name,
              relationName: c.relationName
            }
          }));
          return populatedColumns;
        } else {
          // all the relations within this context and need to look up all the relations
          let populatedColumns: ExprColumnAst[] = getColumnsFromRelationReference(s.baseRelation).map(newColumn => ({
            exprType: ExprType.Column,
            dataType: newColumn.type,
            column: {
              hasStar: false,
              columnName: newColumn.name,
              relationName: getRelationReferenceName(s.baseRelation)
            }
          }));
          s.joinClauses.map(j => {
            const newColumns = createExprColumn(getColumnsFromRelationReference(j.relation), getRelationReferenceName(j.relation));
            populatedColumns = newColumns.concat(newColumns);
          });
          return populatedColumns;
        }
      } else if (c.expr.exprType === ExprType.Column) {
        // we are applying this only for vanilla selections...
        // can do fancier things later
        const currentColumn = (c.expr as ExprColumnAst).column;
        if (!currentColumn.relationName) {
          if (!findColumn(currentColumn, s.baseRelation)) {
            sanityAssert((s.joinClauses) && (s.joinClauses.length > 0), "We cannot find the column in the relations you specified");
            for (let j = 0; j < s.joinClauses.length; j ++) {
              if (findColumn(currentColumn, s.joinClauses[j].relation)) {
                return [currentColumn];
              }
            }
            // if we are here it's bad
            ReportDielUserError(`We were not able to find column: ${currentColumn.columnName}`);
          }
        }
      }
      return [c];
    });
    // fixme: this is incorrect right now since we need to append
    s.columnSelections = [].concat(...columnSet);
  }
}