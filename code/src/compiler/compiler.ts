/// <reference path="../@types/sql-formatter/index.d.ts" />a
import { ANTLRInputStream, CommonTokenStream } from "antlr4ts";
import * as parser from "../parser/grammar/DIELParser";
import * as lexer from "../parser/grammar/DIELLexer";

export function parse(code: string) {
  const inputStream = new ANTLRInputStream(code);
  const l = new lexer.DIELLexer(inputStream);
  const tokenStream = new CommonTokenStream(l);
  return new parser.DIELParser(tokenStream);
}

// export function getSelectionUnitAst(code: string) {

//   const tree = p.selectUnitQuery();
//   let visitor = new Visitor();
//   let ast = visitor.visitSelectUnitQuery(tree);
//   // FIXME: do the things
//   // normalizeColumnSelection
//   // inferType
//   return ast;
// }

