import { ANTLRInputStream, CommonTokenStream } from "antlr4ts";
import * as parser from "../parser/grammar/DIELParser";
import * as lexer from "../parser/grammar/DIELLexer";

import Visitor from "../parser/generateIr";
import { DielConfig } from "../parser/dielTypes";
import { modifyIrFromCrossfilter } from "./codeGenSql";

export function getIR(code: string, config?: DielConfig) {
  console.log("Starting compilation");
  const inputStream = new ANTLRInputStream(code);
  const l = new lexer.DIELLexer(inputStream);
  const tokenStream = new CommonTokenStream(l);
  const p = new parser.DIELParser(tokenStream);
  const tree = p.queries();
  let visitor = new Visitor();
  let ir = visitor.visitQueries(tree);
  if (config) {
    ir.config = config;
  }
  ir = modifyIrFromCrossfilter(ir);
  return ir;
}