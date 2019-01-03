import DielRuntime from "../../code/src/runtime/DielRuntime";
import { Database } from "sql.js";
import { loadPage } from ".";

const ExistingDataPath = "./dist/test.db";

export const runtime = new DielRuntime(loadPage, ExistingDataPath);