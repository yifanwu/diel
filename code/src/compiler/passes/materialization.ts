import { DielAst } from "../../parser/dielAstTypes";
import { DielIr } from "../DielIr";

/**
 * Takes in a DielAst and returns a new one which materializes
 * views that are used by more than one output per input change
 * e.g., in the following example, v1 should be materialized
 *          o1
 *         /
 * t1 -> v1 - o2
 * @param ast
 */
export function simpleMaterializeAst(ir: DielIr): DielAst {
  // originalRelations: OriginalRelation[]; -> t1
  // views: DerivedRelation[]; -> v1 & o1 & o2 will be
  // differentiate views and outputs by relationType field
  // programs: ProgramsIr; -> trigger to update the table will be

  // dependecy helpers
  // generateDependenciesByName
  return {} as DielAst;
}