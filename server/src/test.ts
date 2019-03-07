
import * as sqlite from "better-sqlite3";

const dbFile = "./sample-data/pitchfork.sqlite";
const db = new sqlite(dbFile);
const stmt = db.prepare("SELECT sql, name table_name FROM sqlite_master WHERE type='table' and sql not null");
const r = stmt.all();

console.log(JSON.stringify(r));