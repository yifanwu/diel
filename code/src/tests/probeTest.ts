import * as fs from "fs";
import { ANTLRInputStream, CommonTokenStream } from "antlr4ts";
import * as parser from "../parser/grammar/DIELParser";
import * as lexer from "../parser/grammar/DIELLexer";
import Visitor from "../parser/generateAst";

function main() {
  console.log("starting probe tests");
  const query = fs.readFileSync(`./src/tests/testProb.sql`, "utf8");

  const inputStream = new ANTLRInputStream(query);
  const l = new lexer.DIELLexer(inputStream);
  const tokenStream = new CommonTokenStream(l);
  const p = new parser.DIELParser(tokenStream);
  const tree = p.selectQuery();
  let visitor = new Visitor();
  const ir = visitor.visit(tree);
  console.log(JSON.stringify(ir, null, 2));
}

main();