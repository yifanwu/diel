import { ANTLRInputStream, CommonTokenStream } from "antlr4ts";
import * as parser from "../parser/grammar/DIELParser";
import * as lexer from "../parser/grammar/DIELLexer";

import Visitor from "../parser/generateIr";

export function compileDiel(code: string) {
  const inputStream = new ANTLRInputStream(code);
  const l = new lexer.DIELLexer(inputStream);
  const tokenStream = new CommonTokenStream(l);
  const p = new parser.DIELParser(tokenStream);
  const tree = p.queries();
  // the visitor is essentially an IR?? Though it's a very simple one
  let visitor = new Visitor();
  const ir = visitor.visitQueries(tree);
  return ir;
  // take this result and generate the db file (need a drop of exist on every single new relation)
  // as well as generating javascript files...
}