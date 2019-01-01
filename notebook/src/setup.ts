import { DielRuntime } from "diel";
import { Database } from "sql.js";
import { loadPage } from ".";

async function loadDb() {
  const response = await fetch("./dist/flights.db");
  const bufferRaw = await response.arrayBuffer();
  this.buffer = new Uint8Array(bufferRaw);
  this.db = new Database(this.buffer);
  const runtime = new DielRuntime();
  // FIXME: this might have some async issues
  loadPage();
  return runtime;
}

export const runtime = loadDb();