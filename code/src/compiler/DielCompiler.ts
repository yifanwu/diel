import { DielIr } from "./DielIr";
import { applyTemplates } from "./passes/applyTemplate";
import { applyCrossfilter } from "./passes/applyCrossfilter";
import { ApplyDependencies } from "./passes/dependnecy";
import { NormalizeConstraints } from "./passes/normalizeConstraints";
import { NormalizeColumnSelection } from "./passes/normalizeColumnSelection";
import { InferType } from "./passes/inferType";
import { DielPhysicalExecution } from "../parser/dielAstTypes";
import { MetaDataPhysical } from "../runtime/DielRuntime";
import { DistributeQueries } from "./passes/distributeQueries";

/**
 * Note that the compilation here is logical
 * there will be another pass on how to do the phyical part
 * @param ir the IR that will be manipulated
 */
export function CompileDiel(ir: DielIr) {
  // check names
  ApplyDependencies(ir);
  applyTemplates(ir);
  applyCrossfilter(ir.ast);
  // modifies in place...
  NormalizeConstraints(ir);
  NormalizeColumnSelection(ir);
  InferType(ir);
  return ir;
}

/**
 * At this level, we'd still be reasoning with DielAst's.
 *   E.g., we still need to be manipulating inputs
 *    However, we do not want to be thinking about outputs vs views, but then that just means
 *    we should not generate these view like things.
 * @param ir
 * @param metaData
 */
export function CompilePhysicalExecution(ir: DielIr, metaData: MetaDataPhysical): DielPhysicalExecution {
  return DistributeQueries(ir, metaData);
  // TODO// then materialization
  // MaterializeQueries();
  // // then caching
  // this.cacheQueries();
}