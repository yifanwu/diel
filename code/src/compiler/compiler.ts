import { ANTLRInputStream, CommonTokenStream } from "antlr4ts";
import * as parser from "../parser/grammar/DIELParser";
import * as lexer from "../parser/grammar/DIELLexer";

import Visitor from "../parser/generateIr";
import { LogInternalError } from "../util/messages";

export function getIR(code: string) {
  console.log("Starting compilation");
  let l;
  try {
    const inputStream = new ANTLRInputStream(code);
    l = new lexer.DIELLexer(inputStream);
  } catch (e) {
    LogInternalError(`Parsing failed: ${e}`);
  }
  const tokenStream = new CommonTokenStream(l);
  const p = new parser.DIELParser(tokenStream);
  const tree = p.queries();
  let visitor = new Visitor();
  const ir = visitor.visitQueries(tree);
  return ir;
}
