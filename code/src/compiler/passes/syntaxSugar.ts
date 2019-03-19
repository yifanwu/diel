import {ReportDielUserError} from "../../lib/messages";
import { RelationReference } from "../../../dist/parser/sqlAstTypes";
import { CompositeSelectionUnit, SetOperator, OrderByAst, ColumnSelection, Order, DataType } from "../../../src/parser/dielAstTypes";
import {ExprAst, ExprType} from "../../../src/parser/exprAstTypes";
import {generateSelectionUnit} from "../../../src/compiler/codegen/codeGenSql";
import { basename } from "path";
import { CompositeSelection } from "../../../dist/parser/dielAstTypes";
import { DerivedRelation, SelectionUnit, DielAst, AstType, RelationSelection } from "../../parser/dielAstTypes";
import { GetAllDerivedViews, GetAllPrograms } from "../DielIr";

// implements the transformation for LATEST

// should reference the implementation for `applyTemplates` in `applyTemplate.ts`.

/**
 * This function traverses the places where `RelationReference` might be called
 *   e.g., DerivedRelations, SelectionUnits in programs etc.
 * Yifan can help during 1:1 if this is not clear
 * @param ast
 */
export function applyLatestToAst(ast: DielAst): void {
  // first go through the derivedrelations
  const derived = GetAllDerivedViews(ast);
  derived.map(d => {d.selection.compositeSelections.map(c => {
      applyLatestToSelectionUnit(c.relation);
    });
  });
  // also need to check programs and commands
  GetAllPrograms(ast).map(c => {
    if (c.astType === AstType.RelationSelection) {
      (c as RelationSelection).compositeSelections.map(c => {
        applyLatestToSelectionUnit(c.relation);
      });
    }
  });
}

/**
 * LUCIE TODO
 *  find all the RelationReference instances in the DerivedRelation ASTs
 *   check if they say "isLatest", turn that boolean into false, and change the subquery
 *
 *   report error if there is already a subquery --- LATEST can only be used with a simple
 *   named relation
 *
 *  note this will probably be recursive
 * @param relation
 */
export function applyLatestToSelectionUnit(relation: SelectionUnit): void {
    // console.log(relation.baseRelation.subquery.compositeSelections[0].relation.orderByClause);

    if (relation.baseRelation.isLatest) {
        if (relation.baseRelation.subquery !== undefined) {
            // report error
            return ReportDielUserError("Latest should be used with a simple named relation");
        }
        var relationName = relation.baseRelation.relationName;

        var selection = {
            op: SetOperator.NA,
            relation : {
                isDistinct: false,

                columnSelections : [{
                    alias: null,
                    expr: {
                        exprType: ExprType.Column,
                        dataType: DataType.TBD,
                        hasStar: true
                    } as ExprAst
                }] as ColumnSelection[],

                baseRelation: {
                    alias: null,
                    isLatest: false,
                    relationName: relationName
                } as RelationReference,

                orderByClause : [{
                    selection: {
                        exprType: ExprType.Column,
                        dataType: DataType.TBD,
                        hasStar: false,
                        columnName:  "timestep"
                    } as ExprAst,
                    order: Order.DESC
                } as OrderByAst] as OrderByAst[],

                limitClause : {
                    exprType: ExprType.Val,
                    dataType: DataType.Number,
                    value: 1
                } as ExprAst
            } as SelectionUnit
        } as CompositeSelectionUnit;

        // changing base relation in-place
        relation.baseRelation.isLatest = false;
        relation.baseRelation.relationName = undefined;
        relation.baseRelation.subquery = {
            astType: AstType.RelationSelection,
            compositeSelections: [selection]
        } as RelationSelection;

        var q = generateSelectionUnit(relation);
        console.log(q);
    }

}




// { isDistinct: false,
//     columnSelections: [ { alias: null, expr: [Object] } ],
//     baseRelation: { alias: null, isLatest: false, relationName: 't1' },
//     joinClauses: [],
//     whereClause: null,
//     groupByClause: null,
//     orderByClause: [ { selection: [Object], order: 'DESC' } ],
//     limitClause: { exprType: 'Val', dataType: 'Number', value: 1 } }


// { isDistinct: false,
//     columnSelections: [ { alias: null, expr: [Object] } ],
//     baseRelation: { alias: null, isLatest: false, relationName: 't1' },
//     joinClauses: [],
//     whereClause:
//      { exprType: 'Func',
//        functionType: 'Logic',
//        functionReference: '=',
//        dataType: 'Boolean',
//        args: [ [Object], [Object] ] },
//     groupByClause: null,
//     orderByClause: null,
//     limitClause: null }