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

}