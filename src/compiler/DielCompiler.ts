import { DielIr } from "./DielIr";
import { applyTemplates, tryToApplyATemplate } from "./passes/applyTemplate";
import { applyCrossfilter } from "./passes/applyCrossfilter";
import { ApplyDependencies } from "./passes/dependency";
import { NormalizeConstraints } from "./passes/normalizeConstraints";
import { NormalizeColumnSelection } from "./passes/normalizeColumnSelection";
import { InferType } from "./passes/inferType";
import { RelationSelection } from "../parser/dielAstTypes";

/**
 * Note that the compilation here is logical
 * there will be another pass on how to do the phyical part
 * @param ir the IR that will be manipulated
 */
export function CompileDiel(ir: DielIr) {
  applyTemplates(ir);
  ApplyDependencies(ir);
  applyCrossfilter(ir.ast);
  NormalizeConstraints(ir);
  NormalizeColumnSelection(ir);
  InferType(ir);
  return ir;
}

// there should be a progressive version of this already.
export function CompileAstGivenIr(ir: DielIr, q: RelationSelection) {
  tryToApplyATemplate(q);
  
}