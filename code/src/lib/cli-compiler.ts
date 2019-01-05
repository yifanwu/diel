import { ANTLRInputStream, CommonTokenStream } from "antlr4ts";
import * as lexer from "../parser/grammar/DIELLexer";
import * as parser from "../parser/grammar/DIELParser";

import DielCompiler from "../compiler/DielCompiler";
import { DielConfig } from "../parser/dielAstTypes";
import { LogInfo } from "../lib/messages";
import Visitor from "../parser/generateAst";


export function getDielIr(code: string, config?: DielConfig) {
  LogInfo("Starting compilation");
  const inputStream = new ANTLRInputStream(code);
  const l = new lexer.DIELLexer(inputStream);
  const tokenStream = new CommonTokenStream(l);
  const p = new parser.DIELParser(tokenStream);
  const tree = p.queries();
  let visitor = new Visitor();
  let ast = visitor.visitQueries(tree);
  // apply the templates
  return new DielCompiler(ast, config);
}