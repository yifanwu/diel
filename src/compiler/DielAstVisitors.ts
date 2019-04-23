import { DielAst, Relation, AstType, InsertionClause, SelectionUnit, RelationReference, RelationNameType } from "../parser/dielAstTypes";
import { LogInternalError, LogInternalWarning } from "../util/messages";
import { DerivedRelation } from "..";
import { GetAllDerivedViews } from "./DielAstGetters";

type SelectionUnitFunction<T> = (s: SelectionUnit, ast?: DielAst, relationName?: string) => T;

// --------------- BEGIN SETTERS --------------------

export function AddRelation(ast: DielAst, newR: Relation) {
  // make sure that the name is not found
  const idx = ast.relations.findIndex(r => r.rName === newR.rName);
  if (idx > -1) {
    LogInternalError(`The relation you want to add, ${newR.rName}, is already defined`);
  } else {
    ast.relations.push(newR);
  }
}


export function DeleteRelation(ast: DielAst, relationName: RelationNameType) {
  const idx = ast.relations.findIndex(r => r.rName === relationName);
  if (idx > -1) {
    return ast.relations.splice(idx, 1);
  }
  LogInternalWarning(`Relation ${relationName} to delete was not found`);
  return null;
}

// --------------- BEGIN VISITORS --------------------

// we are going to assume that the AST is sorted in topological order already
export function WalkThroughSelectionUnits<T>(ast: DielAst, fun: SelectionUnitFunction<T>): T[] {
  const results: T[] = [];
  function applyToDerivedRelation(r: DerivedRelation, fun: SelectionUnitFunction<T>): void {
    r.selection.compositeSelections.map(c => {
      const result = fun(c.relation, ast, r.rName);
      results.push(result);
    });
  }
  GetAllDerivedViews(ast).map(r => {
    applyToDerivedRelation(r, fun);
  });
  ast.programs.forEach((commands, _) => {
    commands.map(c => {
      // check the select clause from insert
      if (c.astType === AstType.Insert) {
        const insertClause = c as InsertionClause;
        if (insertClause.selection) {
          insertClause.selection.compositeSelections.map(s => fun(s.relation, ast, undefined));
        }
      }
    });
  });
  return results;
}

// FIXME: I think there are other places with Relation Reference.. should fix later
export function WalkThroughRelationReferences<T>(ast: DielAst, fun: (r: RelationReference) => T): T[] {
  const results: T[] = [];
  const selectionUnitFunc: SelectionUnitFunction<void> = (s: SelectionUnit) => {
    if (s.baseRelation) {
      results.push(fun(s.baseRelation));
      if (s.joinClauses) {
        s.joinClauses.map(j => {
          results.push(fun(j.relation));
        });
      }
    }
  };
  WalkThroughSelectionUnits(ast, selectionUnitFunc);
  return results;
}