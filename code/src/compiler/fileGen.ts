import * as fs from "fs";
import * as path from "path";
import { Database } from "sql.js";

import { genTs } from "./codeGenTs";
import { genSql } from "./codeGenSql";
import { DielAst } from "../parser/dielAstTypes";
import { LogInternalError, LogInfo } from "../lib/messages";

export async function genFiles(ir: DielAst, filePath: string) {
  let dbFileName = "diel.db";
  let sqlFileName = "diel.sql";
  LogInfo(`Generating Files!`);
  // TS gen
  const doc = await genTs(ir);
  fs.writeFileSync(path.join(filePath, "Diel.ts"), doc);

  // SQL gen
  let db;
  if (ir.config && ir.config.existingDbPath) {
    const buffer = fs.readFileSync(ir.config.existingDbPath);
    db = new Database(buffer);
  } else {
    db = new Database();
  }

  const sqlQueries = genSql(ir);

  fs.writeFileSync(path.join(filePath, sqlFileName), sqlQueries.join("\n"));
  for (let s of sqlQueries) {
    try {
      db.run(s);
    } catch (error) {
      LogInternalError(`Error while running\n${s}\n${error}`);
    }
  }
  // FIXME: awk place for config
  if (ir.config && ir.config.name) {
    dbFileName = ir.config.name;
  }
  fs.writeFileSync(path.join(filePath, dbFileName), new Buffer(db.export()));
  return;
}