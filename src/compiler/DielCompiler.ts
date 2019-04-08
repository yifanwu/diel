import { DielIr } from "./DielIr";
import { applyTemplates } from "./passes/applyTemplate";
import { applyCrossfilter } from "./passes/applyCrossfilter";
import { ApplyDependencies } from "./passes/dependnecy";
import { NormalizeConstraints } from "./passes/normalizeConstraints";
import { NormalizeColumnSelection } from "./passes/normalizeColumnSelection";
import { InferType } from "./passes/inferType";

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