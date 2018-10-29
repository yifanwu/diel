import * as fs from "fs";
import { Database } from "sql.js";

import { genTs } from "./codeGenTs";
import { genSql } from "./codeGenSql";
import { DielIr } from "../parser/dielTypes";
import { LogInternalError, LogInfo, LogTmp } from "../util/messages";

export function genFiles(ir: DielIr) {
  LogInfo(`Generating Files!`);
  // TS gen
  fs.writeFileSync("./src/dist/gen/relations.ts", genTs(ir));
  // SQL gen
  let db;
  if (ir.config && ir.config.existingDbPath) {
    const buffer = fs.readFileSync(ir.config.existingDbPath);
    db = new Database(buffer);
  } else {
    db = new Database();
  }
  const sqlQueries = genSql(ir);
  for (let s of sqlQueries) {
    try {
      db.run(s);
    } catch (error) {
      LogInternalError(`Error while running\n${s}\n${error}`);
    }
    LogTmp(`Successfully ran\n${s}`);
  }
  let dbFileName = "diel";
  if (ir.config && ir.config.name) {
    dbFileName = ir.config.name;
  }
  fs.writeFileSync(`./src/dist/gen/${dbFileName}.db`, new Buffer(db.export()));
  fs.writeFileSync(`./src/dist/gen/${dbFileName}.sql`, sqlQueries.join("\n"));
  return true;
}