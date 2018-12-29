import { CompositeSelectionUnit } from "./sqlAstTypes";

// this file is badly named..

// exported in package.json types
// for using DIEL in a notebook settting (not compiler)
export interface QueryAst {
  selections: CompositeSelectionUnit[];
}