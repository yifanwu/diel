import DielRuntime from "../runtime/DielRuntime";

const workerDbPaths = ["./UI-dist/test-worker.db"];
const dielPrefix = "./src/notebook/tests/";
const dielFiles = [
  `${dielPrefix}simple.diel`,
  // `${dielPrefix}counter-worker.diel`,
  `${dielPrefix}single-bar-chart-zoom.diel`
];
const mainDbPath = "./UI-dist/test.db";

export const diel = new DielRuntime({
  dielFiles,
  mainDbPath,
  workerDbPaths
});