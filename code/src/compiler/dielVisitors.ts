import { DielAst, DerivedRelation } from "../parser/dielAstTypes";
import { RelationSelection, AstType, InsertionClause, SelectionUnit } from "../parser/sqlAstTypes";
import { sanityAssert } from "../lib/messages";
import { DielIr } from "./DielIr";

export type SelectionUnitVisitorFunctionOptions = {relationName?: string, ir?: DielIr};
type SelectionUnitFunction<T> = (s: SelectionUnit, optional: SelectionUnitVisitorFunctionOptions) => T;

/**
 * We do not need to apply to programs for now since they don't really need to be understood
 * I think selection unit is fine for now?
 * @param ast abstract syntax tree of the DIEL program
 * @param fun function to apply to the relations
 */
export function ApplyToAllSelectionUnits<T>(ir: DielIr, fun: SelectionUnitFunction<T>, byDependency = false): T[] {
  function applyToDerivedRelation<T>(r: DerivedRelation, fun: SelectionUnitFunction<T>): T[] {
    return r.selection.compositeSelections.map(c => fun(c.relation, {ir, relationName: r.name}));
  }
  let initial: T[] = [];
  if (byDependency) {
    // check if the dependency graph has been built, if not, build it now
    ir.dependencies.topologicalOrder.reduce(
      (acc, r) => acc.concat(ir.allDerivedRelations.get(r).map(c => fun(c.relation, {ir, relationName: r}))), initial);
  } else {
    // this step flattens
    ir.ast.outputs.reduce((acc, r) => acc.concat(applyToDerivedRelation(r, fun)), initial);
    ir.ast.views.reduce((acc, r) => acc.concat(applyToDerivedRelation(r, fun)), initial);
    return initial;
  }
}

export function visitSelections(ast: DielAst, visitSelection: (r: RelationSelection) => void) {
  ast.views.map(v => visitSelection(v.selection));
  ast.outputs.map(v => visitSelection(v.selection));
  ast.programs.map(p => {
    p.queries.map(q => {
      if (q.astType === AstType.RelationSelection) {
        visitSelection(q as RelationSelection);
      } else {
        sanityAssert((q.astType === AstType.Insert), "did not expect anything other than insert or selects");
        const i = q as InsertionClause;
        if (i.selection) {
          visitSelection(i.selection);
        }
      }
    });
  });
}