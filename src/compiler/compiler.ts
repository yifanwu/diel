import { ANTLRInputStream, CommonTokenStream } from "antlr4ts";
import * as parser from "../parser/grammar/DIELParser";
import * as lexer from "../parser/grammar/DIELLexer";
import Visitor from "../parser/generateAst";
import { CompileDiel } from "./DielCompiler";
import { LogInfo } from "../util/messages";
import { DielIr } from "./DielIr";

export function parse(code: string) {
  const inputStream = new ANTLRInputStream(code);
  const l = new lexer.DIELLexer(inputStream);
  const tokenStream = new CommonTokenStream(l);
  return new parser.DIELParser(tokenStream);
}

export function getVanillaSelectionUnitAst(code: string) {
  const inputStream = new ANTLRInputStream(code);
  const l = new lexer.DIELLexer(inputStream);
  const tokenStream = new CommonTokenStream(l);
  const p = new parser.DIELParser(tokenStream);
  const tree = p.selectUnitQuery();
  let visitor = new Visitor();
  let selectionUnitAst = visitor.visitSelectUnitQuery(tree);
  return selectionUnitAst;
}

export function getDielIr(code: string) {
  const ast = getDielAst(code);
  // apply the templates
  return CompileDiel(new DielIr(ast));
}

export function getDielAst(code: string) {
  LogInfo(`Starting compilation of ${code}`);
  const inputStream = new ANTLRInputStream(code);
  const l = new lexer.DIELLexer(inputStream);
  const tokenStream = new CommonTokenStream(l);
  const p = new parser.DIELParser(tokenStream);
  const tree = p.queries();
  let visitor = new Visitor();
  let ast = visitor.visitQueries(tree);
  return ast;
}