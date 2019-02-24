import { ANTLRInputStream, CommonTokenStream } from "antlr4ts";
import * as lexer from "../parser/grammar/DIELLexer";
import * as parser from "../parser/grammar/DIELParser";

import {CompileDiel} from "../compiler/DielCompiler";
import { LogInfo } from "../lib/messages";
import Visitor from "../parser/generateAst";
import { DielIr } from "../compiler/DielIr";


export function getDielIr(code: string) {
  LogInfo(`Starting compilation of ${code}`);
  const inputStream = new ANTLRInputStream(code);
  const l = new lexer.DIELLexer(inputStream);
  const tokenStream = new CommonTokenStream(l);
  const p = new parser.DIELParser(tokenStream);
  const tree = p.queries();
  let visitor = new Visitor();
  let ast = visitor.visitQueries(tree);
  // apply the templates
  return CompileDiel(new DielIr(ast));
}