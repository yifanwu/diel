import { DielAst } from "../../parser/dielAstTypes";

// in this pass, we will create the Ir needed to create the SQL we need

export interface SqlIr {
  // tablespec
  // table
  // views
  // triggers
  // inserts
}

export function createSqlIr(ast: DielAst) {
  // turn inputs into table spec and triggers
  // turn dynamicTables into tables
  // turn staticTables into tables
  // turn outputs into views
  // views into views
  // programs into triggers
}