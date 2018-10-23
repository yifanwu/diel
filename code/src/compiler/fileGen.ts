import * as fs from "fs";
import { Database } from "sql.js";

import { genTs } from "./codeGenTs";
import { genSql } from "./codeGenSql";
import { DielIr } from "../parser/dielTypes";
import { LogInternalError } from "../util/messages";

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