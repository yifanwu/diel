import DielRuntime from "../runtime/DielRuntime";

// const workerDbPaths = ["./UI-dist/test-worker.db"];
const workerDbPaths: string[] = undefined;
const dielPrefix = "./src/notebook/tests/";
const dielFiles = [
  // `${dielPrefix}simple.diel`,
  `${dielPrefix}pitchfork.diel`,
  `${dielPrefix}counter-worker.diel`,
  `${dielPrefix}linked-bar-charts.diel`,
  `${dielPrefix}single-bar-chart-zoom.diel`
];
const mainDbPath = "./UI-dist/test.db";

const socketConnection = [{url: "ws://localhost:8999", dbName: "pitchfork"}];

export const diel = new DielRuntime({
  dielFiles,
  mainDbPath,
  workerDbPaths,
  socketConnections: socketConnection
});