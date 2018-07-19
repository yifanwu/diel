import { ANTLRInputStream, CommonTokenStream } from "antlr4ts";
import Simplevisitor from "./SimpleVisitor";
import * as parser from "./grammar/DIELParser";
import * as lexer from "./grammar/DIELLexer";


export function compileDiel(code: string) {
  let inputStream = new ANTLRInputStream(code);
  let l = new lexer.DIELLexer(inputStream);
  let tokenStream = new CommonTokenStream(l);
  let p = new parser.DIELParser(tokenStream);
  let tree = p.queries();
  // the visitor is essentially an IR?? Though it's a very simple one
  let simplevisitor = new Simplevisitor();
  let result = simplevisitor.visitQueries(tree);

  // take this result and generate the db file (need a drop of exist on every single new relation)
  // as well as generating javascript files...

  console.log(JSON.stringify(result));
}