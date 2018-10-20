import * as fs from "fs";
// import * as util from "util";
import { Database } from "sql.js";

import { ANTLRInputStream, CommonTokenStream } from "antlr4ts";
import * as parser from "../parser/grammar/DIELParser";
import * as lexer from "../parser/grammar/DIELLexer";

import Visitor from "../parser/generateIr";
import { genTs } from "./codeGenTs";
import { genSql } from "./codeGenSql";
import { LogInternalError } from "../util/messages";
import { VERBOSE } from "./config";
import { DielIr } from "../parser/dielTypes";

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

export function genFiles(ir: DielIr) {
  // TS gen
  fs.writeFileSync("./src/dist/gen/relations.ts", genTs(ir));
  // SQL gen
  const db = new Database();
  const sqlQueries = genSql(ir);
  for (let s of sqlQueries) {
    try {
      db.run(s);
    } catch (error) {
      LogInternalError(error);
    }
  }
  fs.writeFileSync("./src/dist/gen/diel.db", new Buffer(db.export()));
  return true;
}