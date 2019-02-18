import { DielIr } from "./DielIr";
import { applyTemplates } from "./passes/applyTemplate";
import { applyCrossfilter } from "./passes/applyCrossfilter";
import { ApplyDependencies } from "./passes/dependnecy";
import { NormalizeConstraints } from "./passes/normalizeConstraints";
import { NormalizeColumnSelection } from "./passes/normalizeColumnSelection";
import { InferType } from "./passes/inferType";

export function CompileDiel(ir: DielIr) {
  ApplyDependencies(ir);
  applyTemplates(ir);
  applyCrossfilter(ir.ast);
  // modifies in place...
  NormalizeConstraints(ir);
  NormalizeColumnSelection(ir);
  InferType(ir);
  return ir;
}