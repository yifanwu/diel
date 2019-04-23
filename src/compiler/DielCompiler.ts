import { IsRelationTypeDerived } from "./DielAstGetters";
import { ApplyTemplates, TryToApplyTemplate, TryToCopyRelationSpec } from "./passes/applyTemplate";
import { ApplyCrossfilter } from "./passes/applyCrossfilter";
import { AddDepTree, AddSingleDependencyByDerivedRelation, ArrangeInTopologicalOrder } from "./passes/dependency";
import { NormalizeConstraints, NormalizeConstraintsForSingleOriginalRelation } from "./passes/normalizeConstraints";
import { NormalizeColumnSelection, NormalizeColumnForDerivedRelation } from "./passes/normalizeColumnSelection";
import { InferType, InferTypeForDerivedRelation } from "./passes/inferType";
import { DerivedRelation, OriginalRelation, DielAst } from "../parser/dielAstTypes";
import { AddRelation } from "./DielAstVisitors";
import { NormalizeAlias } from "./passes/normalizeAlias";

/**
 * Note that the compilation here is logical
 * there will be another pass on how to do the phyical part
 * @param ir the IR that will be manipulated
 */
export function CompileDiel(ast: DielAst) {
  ApplyTemplates(ast);
  ApplyCrossfilter(ast);
  NormalizeAlias(ast);
  AddDepTree(ast);
  ArrangeInTopologicalOrder(ast);
  NormalizeConstraints(ast);
  NormalizeColumnSelection(ast);
  InferType(ast);
  return ast;
}

// there should be a progressive version of this already.
// do not support crossfilter for now, but easy to fix!
export function CompileAstGivenIr(ast: DielAst, relation: OriginalRelation | DerivedRelation) {
  if (IsRelationTypeDerived(relation.relationType)) {
    CompileDerivedAstGivenAst(ast, relation as DerivedRelation);
  } else {
    CompileOriginalAstGivenIr(ast, relation as OriginalRelation);
  }
}

export function CompileDerivedAstGivenAst(ast: DielAst, view: DerivedRelation) {
  AddRelation(ast, view);
  TryToApplyTemplate(view.selection);
  AddSingleDependencyByDerivedRelation(ast, view);
  NormalizeColumnForDerivedRelation(ast, view);
  InferTypeForDerivedRelation(ast, view);
  return view;
}

export function CompileOriginalAstGivenIr(ast: DielAst, original: OriginalRelation) {
  TryToCopyRelationSpec(ast, original);
  // TODO: need to add the depends on dependency...
  NormalizeConstraintsForSingleOriginalRelation(original);
  return original;
}