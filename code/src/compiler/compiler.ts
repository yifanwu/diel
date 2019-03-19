/// <reference path="../@types/sql-formatter/index.d.ts" />a
import { ANTLRInputStream, CommonTokenStream } from "antlr4ts";
import * as parser from "../parser/grammar/DIELParser";
import * as lexer from "../parser/grammar/DIELLexer";
import Visitor from "../parser/generateAst";
// import { inferTypeForSelection } from "./passes/inferType";
// import { diel } from "../notebook/setup";
import { DielAst } from "../parser/dielAstTypes";

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

export function getSelectionUnitAst(code: string) {
  // FIXME: limitation: do not use stars
  // normalizeColumnSelection
  // const selectionUnitAst = getVanillaSelectionUnitAst(code);
  // inferTypeForSelection(selectionUnitAst, {ir: diel.ir});
  // inferType
  // return selectionUnitAst;
}

export function getDielAst(code: string) {
  const p = parse(code);
  let visitor = new Visitor();
  return visitor.visit(p.queries());
}