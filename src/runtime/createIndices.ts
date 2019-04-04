import { DerivedRelation } from "../parser/dielAstTypes";
import { DbIdType } from "../compiler/DielPhysicalExecution";

export interface IndexAst {
  table: string;
  columns: string[];
}

/**
 * createIndicesForQuery will be invoked by the runtime at setup
 * Steps:
 * - figureout if there are any predicates or join condition
 * - see if we need to decide based on relation size (if so, invoke getRelationSize)
 * - return the index that we need to build
 * @param query 
 * @param getRelationSize 
 */
export async function createIndicesForQuery(query: DerivedRelation, getRelationSize: (rName: string) => Promise<number>): IndexAst[] {

}