import { DielAst } from "../parser/dielAstTypes";

export function addTypes(ir: DielAst) {
  // walk through all the select queries in the IR
  // it's really annoying to organize the internal objects as I want to filter them by different attributes --- would be nice to have a relational representation internally haha

  // const query = getCtxSourceCode(ctx);
  // columns.filter(c => c.type === DataType.TBD).map(c => findType(c, selectBody, query, this.context));
}