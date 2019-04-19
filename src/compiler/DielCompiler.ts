import { DielIr, IsRelationTypeDerived } from "./DielIr";
import { ApplyTemplates, TryToApplyTemplate, TryToCopyRelationSpec } from "./passes/applyTemplate";
import { ApplyCrossfilter } from "./passes/applyCrossfilter";
import { ApplyDependencies, AddDependency } from "./passes/dependency";
import { NormalizeConstraints, NormalizeConstraintsForSingleOriginalRelation } from "./passes/normalizeConstraints";
import { NormalizeColumnSelection, NormalizeColumnForDerivedRelation } from "./passes/normalizeColumnSelection";
import { InferType, InferTypeForDerivedRelation } from "./passes/inferType";
import { RelationSelection, DerivedRelation, OriginalRelation, RelationType } from "../parser/dielAstTypes";

/**
 * Note that the compilation here is logical
 * there will be another pass on how to do the phyical part
 * @param ir the IR that will be manipulated
 */
export function CompileDiel(ir: DielIr) {
  ApplyTemplates(ir);
  ApplyDependencies(ir);
  ApplyCrossfilter(ir.ast);
  NormalizeConstraints(ir);
  NormalizeColumnSelection(ir);
  InferType(ir);
  return ir;
}

// there should be a progressive version of this already.
// do not support crossfilter for now, but easy to fix!
export function CompileAstGivenIr(ir: DielIr, relation: OriginalRelation | DerivedRelation) {
  if (IsRelationTypeDerived(relation.relationType)) {
    CompileDerivedAstGivenIr(ir, relation as DerivedRelation);
  } else {
    CompileOriginalAstGivenIr(ir, relation as OriginalRelation);
  }
}

export function CompileDerivedAstGivenIr(ir: DielIr, view: DerivedRelation) {
  TryToApplyTemplate(view.selection);
  AddDependency(ir.dependencies.depTree, view.selection.compositeSelections, view.rName);
  NormalizeColumnForDerivedRelation(ir, view);
  InferTypeForDerivedRelation(ir, view);
  // assume that this is in place edit
  // FIXME: this is a brittle assumption!!!
  return view;
}

export function CompileOriginalAstGivenIr(ir: DielIr, original: OriginalRelation) {
  TryToCopyRelationSpec(ir, original);
  // no need to add dependency
  NormalizeConstraintsForSingleOriginalRelation(original);
  return original;
}