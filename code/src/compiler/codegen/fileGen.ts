import * as fs from "fs";
import * as path from "path";
import { Database } from "sql.js";

import { LogInternalError, LogInfo } from "../../lib/messages";
import DielCompiler from "../DielCompiler";

export async function genFiles(c: DielCompiler, filePath: string) {
  let dbFileName = "diel.db";
  let sqlFileName = "diel.sql";
  LogInfo(`Generating Files!`);
  // TS gen
  const doc = await c.GenerateTs();
  fs.writeFileSync(path.join(filePath, "Diel.ts"), doc);

  // SQL gen
  let db;
  if (c.config && c.config.existingDbPath) {
    const buffer = fs.readFileSync(c.config.existingDbPath);
    db = new Database(buffer);
  } else {
    db = new Database();
  }

  const sqlQueries = c.GenerateSql();
  fs.writeFileSync(path.join(filePath, sqlFileName), sqlQueries.join("\n"));
  for (let s of sqlQueries) {
    try {
      db.run(s);
    } catch (error) {
      LogInternalError(`Error while running\n${s}\n${error}`);
    }
  }
  // FIXME: awk place for config
  if (c.config && c.config.name) {
    dbFileName = c.config.name;
  }
  fs.writeFileSync(path.join(filePath, dbFileName), new Buffer(db.export()));
  return;
}