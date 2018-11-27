/// <reference path="../@types/sql-formatter/index.d.ts" />a
import { ANTLRInputStream, CommonTokenStream } from "antlr4ts";
import * as parser from "../parser/grammar/DIELParser";
import * as lexer from "../parser/grammar/DIELLexer";
import * as sqlFormatter from "sql-formatter";

import TemplateVisitor from "../parser/compileTemplate";
import Visitor from "../parser/generateAst";
import { DielConfig } from "../parser/dielAstTypes";
import { modifyIrFromCrossfilter } from "./codegen/codeGenSql";
import { LogInfo } from "../lib/messages";

export function applyTempalates(code: string, config?: DielConfig) {
  // optimization step: see if there are templates; if there are not, don't run the queries
  if (code.toUpperCase().includes("CREATE TEMPLATE")) {
    // then do the thing
    const inputStream = new ANTLRInputStream(code);
    const l = new lexer.DIELLexer(inputStream);
    const tokenStream = new CommonTokenStream(l);
    const p = new parser.DIELParser(tokenStream);
    const tree = p.queries();
    let visitor = new TemplateVisitor();
    // template pass
    const templatedCodeRaw = visitor.visitQueries(tree);
    const templatedCode = sqlFormatter.format(templatedCodeRaw);
    // take templatedCode and format them
    return templatedCode;
  } else {
    return code;
  }
}

export function getIR(code: string, config?: DielConfig) {
  LogInfo("Starting compilation");
  const inputStream = new ANTLRInputStream(code);
  const l = new lexer.DIELLexer(inputStream);
  const tokenStream = new CommonTokenStream(l);
  const p = new parser.DIELParser(tokenStream);
  const tree = p.queries();
  let visitor = new Visitor();
  // template pass
  let ir = visitor.visitQueries(tree);
  // now the templates has been filled in
  if (config) {
    ir.config = config;
  }
  ir = modifyIrFromCrossfilter(ir);
  return ir;
}