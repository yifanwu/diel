import { DielAst } from "../parser/dielAstTypes";
import { RelationSelection, AstType, InsertionClause } from "../parser/sqlAstTypes";
import { sanityAssert } from "../lib/messages";

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