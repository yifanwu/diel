import * as fs from "fs";
// import * as util from "util";
import { Database } from "sql.js";

import { ANTLRInputStream, CommonTokenStream } from "antlr4ts";
import * as parser from "../parser/grammar/DIELParser";
import * as lexer from "../parser/grammar/DIELLexer";

import Visitor from "../parser/generateIr";
import { genTs } from "./codeGenTs";
import { genSql } from "./codeGenSql";
import { LogError } from "../util/messages";
import { VERBOSE } from "./config";
import { DielIr } from "../parser/dielTypes";

export function getIR(code: string) {
  console.log("Starting compilation");
  const inputStream = new ANTLRInputStream(code);
  const l = new lexer.DIELLexer(inputStream);
  const tokenStream = new CommonTokenStream(l);
  const p = new parser.DIELParser(tokenStream);
  const tree = p.queries();
  let visitor = new Visitor();
  const ir = visitor.visitQueries(tree);
  return ir;
}

export function genFiles(ir: DielIr) {
  // TS gen
  // const writeFile = util.promisify(fs.writeFile);
  // await writeFile
  fs.writeFileSync("./src/dist/gen/relations.ts", genTs(ir));
  // SQL gen
  const db = new Database();
  const sqlQueries = genSql(ir);
  for (let s of sqlQueries) {
    try {
      db.run(s);
    } catch (error) {
      LogError(error);
    }
  }
  fs.writeFileSync("./src/dist/gen/diel.db", new Buffer(db.export()));
  return true;
}