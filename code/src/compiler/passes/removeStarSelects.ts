import { DielAst } from "../../parser/dielAstTypes";
import { RelationSelection, SelectionUnit, RelationReference, Column } from "../../parser/sqlAstTypes";
import { ReportDielUserError } from "../../lib/messages";
import { ExprColumnAst, ExprType } from "../../parser/exprAstTypes";

interface RelationColumns {
  refName: string;
  columns: Column[];
}

/**
 * this pass removes the .*
 * to find all the selects, we need to find all the relations
 * [ ] we can make this generalizable, like a walker to find all relation and then apply some function on it
 * notes:
 * - we need to keep track of subqueries, e.g., select k.* from (select * from t1) k;
 * the visitation order matters. We probably want to start with the leaves
 * can we do it such that we revursively do it --- like if it's not done, trigger the function again until it's done (is this why it's so fractal-ly???)
 */

 export function applyStarReferences(ast: DielAst): void {
  // views/output, and programs
  // similar structure
  let context;
  ast.views.map(v => visitSelection(v.selection));

  function findGolbalRelation(refName: string): Column[] {
    const dynamicResult = ast.inputs.concat(ast.dynamicTables).filter(r => r.name === refName);
    if (dynamicResult.length > 0) {
      return dynamicResult[0].columns;
    }
    // now check the other relations
    const staticResult = ast.outputs.concat(ast.views).filter(r => r.name === refName);
    if (staticResult.length > 0) {
      const staticResultUnitSelection = staticResult[0].selection.selections[0].relation;
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
      const refRelation = ref.subquery.selections[0].relation;
      if (!refRelation.columns) {
        // recursive!
        visitSelectionUnit(refRelation);
      }
      return refRelation.columns;
    } else {
      return findGolbalRelation(ref.relationName);
    }
  }

  function visitSelection(r: RelationSelection): void {
    r.selections.map(s => visitSelectionUnit(s.relation));
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

  function createExprColumn(cols: Column[]) {

  }

  function visitSelectionUnit(s: SelectionUnit): void {
    // the body of the function
    const columnSet = s.selections.map(c => {
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
              relationName: s.baseRelation.alias ? s.baseRelation.alias : s.baseRelation.relationName
            }
          }));
          s.joinClauses.map(j => {
            populatedColumns.push(getColumnsFromRelationReference(j.relation).map(found => ({

            })));
          });
          
        }
      }
    });
    s.selections = [].concat(...columnSet);
  }
}