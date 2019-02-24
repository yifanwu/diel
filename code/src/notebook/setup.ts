import DielRuntime from "../runtime/DielRuntime";

const workerDbPaths = ["./UI-dist/test-worker.db"];
const dielFiles = ["./src/notebook/tests/simple.diel"];
const mainDbPath = "./UI-dist/test.db";

export const diel = new DielRuntime({
  dielFiles,
  mainDbPath,
  workerDbPaths
});