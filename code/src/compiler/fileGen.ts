import * as fs from "fs";
import * as path from "path";
import { Database } from "sql.js";

import { genTs } from "./codeGenTs";
import { genSql } from "./codeGenSql";
import { DielIr } from "../parser/dielTypes";
import { LogInternalError, LogInfo } from "../util/messages";

export function genFiles(ir: DielIr, filePath: string) {
  let dbFileName = "diel.db";
  let sqlFileName = "diel.sql";
  LogInfo(`Generating Files!`);
  // TS gen
  fs.writeFileSync(path.join(filePath, "relations.ts"), genTs(ir));
  // diel will be imported from the repo...
  // fs.createReadStream("./src/dist/Diel.ts").pipe(fs.createWriteStream(path.join(filePath, "Diel.ts")));

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