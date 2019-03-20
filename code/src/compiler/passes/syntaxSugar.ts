import {ReportDielUserError} from "../../lib/messages";
import { RelationReference } from "../../../dist/parser/sqlAstTypes";
import { CompositeSelectionUnit, SetOperator, OrderByAst, ColumnSelection, Order, DataType } from "../../../src/parser/dielAstTypes";
import {ExprAst, ExprType, ExprColumnAst, ExprRelationAst, FunctionType} from "../../../src/parser/exprAstTypes";
import {generateSqlFromDielAst, generateSelectionUnit} from "../../../src/compiler/codegen/codeGenSql";
import { basename } from "path";
import { CompositeSelection } from "../../../dist/parser/dielAstTypes";
import { DerivedRelation, SelectionUnit, DielAst, AstType, RelationSelection } from "../../parser/dielAstTypes";
import { GetAllDerivedViews, GetAllPrograms } from "../DielIr";
import { ExprFunAst } from "../../../dist/parser/exprAstTypes";

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
    let pretty = JSON.stringify(relation, null, 2);
    console.log(pretty);

    if (relation.baseRelation.isLatest) {
        if (relation.baseRelation.subquery !== undefined) {
            // report error
            return ReportDielUserError("Latest should be used with a simple named relation");
        }
        var relationName = relation.baseRelation.relationName;
        // 1. set isLastest to false
        relation.baseRelation.isLatest = false;

        // 2. change where clause
        // 2-0. save existing where clause
        var originalWhere = relation.whereClause;
        // 2-1. create exprast for relation.timestep
        var lhsExpr = {
            exprType: ExprType.Column,
            dataType: DataType.TBD,
            hasStar: false,
            columnName: "timestep",
            relationName: relationName
        } as ExprAst;

        // 2-2. create exprast for subquery (select max(timestep) from relation)
        var rhsExpr = createSubquery(relationName);

        // 2-3. Merge into a where query
        var whereAST = {
            exprType: ExprType.Func,
            functionType: FunctionType.Logic,
            functionReference: "=",
            dataType: DataType.Boolean,
            args: [lhsExpr, rhsExpr]
        } as ExprFunAst;

        // 3. set the where clause in place
        if (originalWhere === null || originalWhere === undefined) {
            whereAST.args = [lhsExpr, rhsExpr];
            relation.whereClause = whereAST;
        } else {
            lhsExpr = modifyWhere(originalWhere, lhsExpr);
            whereAST.args = [lhsExpr, rhsExpr];
            relation.whereClause = whereAST;
        }
    }

}

/**
 * Modify existing whereClause and return it so that a new ExprAst can be appended
*/
 function modifyWhere(originalAST: ExprAst, lhs: ExprAst): ExprAst {
    var andAst = {
        exprType: ExprType.Func,
        functionType: FunctionType.Logic,
        functionReference: "and",
        dataType: DataType.Boolean,
        args: [originalAST, lhs]
    } as ExprAst;

    return andAst;
}

/**
 * Create ExprAst for the clause (select max(relationName) from relationName).
*/
function createSubquery(relationName: string): ExprAst {
    var relationAST = {
        exprType: ExprType.Relation,
        dataType: DataType.Relation,
        selection: {
            astType: AstType.RelationSelection,
            compositeSelections: [
                {
                    op: SetOperator.NA,
                    relation: {
                        isDistinct: false,
                        columnSelections: [
                            {
                                alias: null,
                                expr: {
                                    exprType: ExprType.Func,
                                    dataType: DataType.TBD,
                                    functionType: FunctionType.Custom,
                                    functionReference: "max",
                                    args: [
                                        {
                                            exprType: ExprType.Column,
                                            dataType: DataType.TBD,
                                            hasStar: false,
                                            columnName: "timestep"
                                        }
                                    ]
                                }
                            }
                        ],
                        baseRelation: {
                            alias: null,
                            isLatest: false,
                            relationName: relationName
                        },
                        joinClauses: [],
                        whereClause: null,
                        groupByClause: null,
                        orderByClause: null,
                        limitClause: null
                    }
                }
            ]
        }
    } as ExprRelationAst;

    return relationAST;
}
