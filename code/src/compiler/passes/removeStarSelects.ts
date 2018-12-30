import { DielAst, DataType } from "../../parser/dielAstTypes";
import { RelationSelection, SelectionUnit, RelationReference, Column, getRelationReferenceName, SimpleColumSelection, ColumnSelection } from "../../parser/sqlAstTypes";
import { ReportDielUserError, sanityAssert, LogInternalError } from "../../lib/messages";
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
      hasStar: false,
      columnName: c.name,
      relationName: relation,
    }));
  }

  function findColumn(currentColumn: SimpleColumSelection, relation: RelationReference) {
    if (!currentColumn.columnName) {
      throw LogInternalError(`findColumn should not be trying to find star columns!`);
    }
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
    const derivedColumnSelections: ColumnSelection[] = s.columnSelections.map(c => {
      // in this iteration, we need to populate the columns field --> which should just be the name and the type with no other information
      if (c.expr.exprType === ExprType.Column) {
        const currentColumnExpr = c.expr as ExprColumnAst;
        if (currentColumnExpr.hasStar) {
          // both of the following options will need to append to the selections
          if (currentColumnExpr.relationName) {
            // case 1: find the columns of just the relations specified
            const foundRelation = findLocalRelation(s, currentColumnExpr.relationName);
            if (!foundRelation) {
              ReportDielUserError(`Relation not defined`);
            }
            // now replace and set hasStar to false
            // create new ExprColumnAst for all the columsn
            const populatedColumns: ColumnSelection[] = foundRelation.map(newColumn => ({
              expr: {
                exprType: ExprType.Column,
                dataType: newColumn.type,
                hasStar: false,
                columnName: newColumn.name,
                relationName: currentColumnExpr.relationName
              },
              // cannot alias stars
              alias: null,
            }));
            return populatedColumns;
          } else {
            // case 2: find all the relations
            let populatedColumns: ColumnSelection[] = getColumnsFromRelationReference(s.baseRelation).map(newColumn => ({
              expr: {
                exprType: ExprType.Column,
                dataType: newColumn.type,
                hasStar: false,
                columnName: newColumn.name,
                relationName: getRelationReferenceName(s.baseRelation)
              },
              // cannot alias stars
              alias: null
            }));
            s.joinClauses.map(j => {
              const relationName = getRelationReferenceName(j.relation);
              const newColumns: ColumnSelection[] = getColumnsFromRelationReference(j.relation).map(c => ({
                expr: {
                  exprType: ExprType.Column,
                  dataType: DataType.TBD,
                  hasStar: false,
                  columnName: c.name,
                  relationName: relationName,
                },
                alias: null
              }));
              populatedColumns = newColumns.concat(newColumns);
            });
            return populatedColumns;
          }
        } else if (!currentColumnExpr.relationName) {
          // case 3: we need to populate which relation it's from for normalization
          if (!findColumn(currentColumnExpr, s.baseRelation)) {
            sanityAssert((s.joinClauses) && (s.joinClauses.length > 0), "We cannot find the column in the relations you specified");
            for (let j = 0; j < s.joinClauses.length; j ++) {
              if (findColumn(currentColumnExpr, s.joinClauses[j].relation)) {
                // copy currentColumn
                // then set it
                currentColumnExpr.relationName = s.joinClauses[j].relation.relationName;
                const derivedColumnSelection: ColumnSelection = {
                  expr: {
                    exprType: ExprType.Column,
                    dataType: currentColumnExpr.dataType,
                    columnName: currentColumnExpr.columnName,
                    hasStar: false,
                    relationName: getRelationReferenceName(currentColumnExpr),
                  },
                  alias: c.alias,
                };
                return [derivedColumnSelection];
              }
            }
            // if we are here it's bad
            ReportDielUserError(`We were not able to find column: ${currentColumnExpr.columnName}`);
          } else {
            // this is base relation, we can set it to the case relation in place
            const derivedColumnSelection: ColumnSelection = {
              expr: {
                exprType: ExprType.Column,
                dataType: currentColumnExpr.dataType,
                columnName: currentColumnExpr.columnName,
                hasStar: false,
                relationName: getRelationReferenceName(s.baseRelation),
              },
              alias: c.alias,
            };
            return [derivedColumnSelection];
          }
        }
        // case 4: no modification needed!
        return [copyColumnSelection(c)];
      } else {
        // it could also be functions; expand the collumns in these functions #TODO
      }
    });
    s.derivedColumnSelections = [].concat(...derivedColumnSelections);
  }
}

function copyColumnSelection(s: ColumnSelection) {
  return  {
    expr: {
      exprType: ExprType.Column,
      dataType: DataType.TBD,
      columnName: (s.expr as ExprColumnAst).columnName,
      hasStar: false,
      relationName: (s.expr  as ExprColumnAst).relationName,
    },
    alias: s.alias,
  };
}