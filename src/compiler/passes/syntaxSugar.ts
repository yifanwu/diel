import {ReportDielUserError, LogInternalError} from "../../util/messages";
import { ExprAst, ExprType, ExprRelationAst, FunctionType, ExprFunAst, SetOperator, DielDataType, DerivedRelation, RelationReferenceType, RelationReferenceDirect, RelationReferenceSubquery, RelationReference } from "../../../src/parser/dielAstTypes";
import { SelectionUnit, DielAst, AstType, RelationSelection } from "../../parser/dielAstTypes";
import { GetAllDerivedViews, GetAllPrograms,  } from "../DielAstGetters";
import { WalkThroughSelectionUnits } from "../DielAstVisitors";

/**
 * This function traverses the places where `RelationReference` might be called
 *   e.g., DerivedRelations, SelectionUnits in programs etc.
 * @param ast
 */
export function applyLatestToAst(ast: DielAst): void {
  // TODO: check
  WalkThroughSelectionUnits(ast, applyLatestToSelectionUnit);
  // // first go through the derivedrelations
  // const derived = GetAllDerivedViews(ast);
  // derived.map(d => {d.selection.compositeSelections.map(c => {
  //   applyLatestToSelectionUnit(c.relation);
  // });
  // });
  // // also need to check programs and commands
  // ast.programs.forEach(c => {
  // if (c.astType === AstType.RelationSelection) {
  //   (c as RelationSelection).compositeSelections.map(c => {
  //   applyLatestToSelectionUnit(c.relation);
  //   });
  // }
  // });

}

export function ApplyLatestToDerivedRelation(derived: DerivedRelation) {
  derived.selection.compositeSelections.map(s => applyLatestToSelectionUnit(s.relation));
  return derived;
}

// IN PLACE
function applyLatestToRelationReference(ref: RelationReference, selection: SelectionUnit): void {
  switch (ref.relationReferenceType) {
    case RelationReferenceType.Direct: {
      const r = ref as RelationReferenceDirect;
      let relationName = r.relationName;
      // we will be doing a rewrite!
      modifyWhereComplete(selection, relationName);
      return;
    }
    case RelationReferenceType.Subquery: {
      return ReportDielUserError("Latest should be used with a simple named relation");
    }
    default:
      LogInternalError(``);
      return;
  }
}

/**
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
  if (!relation.baseRelation) return;
  applyLatestToRelationReference(relation.baseRelation, relation);
  if (!relation.joinClauses) return;
  for (let i = 0; i < relation.joinClauses.length; i++) {
    applyLatestToRelationReference(relation.joinClauses[i].relation, relation);
  }
}

/**
 * Modify WhereClause in relation in place, appending timestep clause for the relationName.
 *
 * In other words, append the following to the ast whereclause:
 * relationName.timestep = (select max(relationName) from relationName).
 *
 * @param relation
 * @param relationName
 */
function modifyWhereComplete(relation: SelectionUnit, relationName: string): void {
  let originalWhere = relation.whereClause;
  // 2-1. create exprast for relation.timestep
  let lhsExpr = {
    exprType: ExprType.Column,
    hasStar: false,
    columnName: "timestep",
    relationName: relationName
  } as ExprAst;

  // 2-2. create exprast for subquery (select max(timestep) from relation)
  let rhsExpr = createSubquery(relationName);

  // 2-3. Merge into a where query
  let whereAST = {
    exprType: ExprType.Func,
    functionType: FunctionType.Logic,
    functionReference: "=",
    dataType: DielDataType.Boolean,
    args: []
  } as ExprFunAst;

  // 2-4. set the where clause in place
  if (originalWhere === null || originalWhere === undefined) {
    whereAST.args = [lhsExpr, rhsExpr];
    relation.whereClause = whereAST;
  } else {
    lhsExpr = modifyExistingWhere(originalWhere, lhsExpr);
    whereAST.args = [lhsExpr, rhsExpr];
    relation.whereClause = whereAST;
  }
}

/**
 * Modify existing whereClause and return it so that a new ExprAst can be appended
*/
 function modifyExistingWhere(originalAST: ExprAst, lhs: ExprAst): ExprAst {
  let andAst = {
    exprType: ExprType.Func,
    functionType: FunctionType.Logic,
    functionReference: "and",
    dataType: DielDataType.Boolean,
    args: [originalAST, lhs]
  } as ExprAst;

  return andAst;
}

/**
 * Create ExprAst for the clause (select max(relationName) from relationName).
*/
function createSubquery(relationName: string): ExprAst {
  let relationAST = {
    exprType: ExprType.Relation,
    dataType: DielDataType.Relation,
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
                  // dataType: DielDataType.TBD,
                  functionType: FunctionType.Custom,
                  functionReference: "max",
                  args: [
                    {
                      exprType: ExprType.Column,
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
