/// <reference path="../@types/sql-formatter/index.d.ts" />a
import { ANTLRInputStream, CommonTokenStream } from "antlr4ts";
import * as parser from "../parser/grammar/DIELParser";
import * as lexer from "../parser/grammar/DIELLexer";

import Visitor from "../parser/generateAst";
import { DielConfig } from "../parser/dielAstTypes";
import { LogInfo } from "../lib/messages";

export function getDielAst(code: string, config?: DielConfig) {
  LogInfo("Starting compilation");
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
  // apply the templates
  return ir;
}

export function getSelectionUnitAst(code: string) {
  const inputStream = new ANTLRInputStream(code);
  const l = new lexer.DIELLexer(inputStream);
  const tokenStream = new CommonTokenStream(l);
  const p = new parser.DIELParser(tokenStream);
  const tree = p.selectUnitQuery();
  let visitor = new Visitor();
  let ir = visitor.visitSelectUnitQuery(tree);
  // FIXME: do the things.
  return ir;
}