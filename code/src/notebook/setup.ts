import DielRuntime from "../runtime/DielRuntime";

// const workerDbPaths = ["./UI-dist/flights.sqlite"];
const workerDbPaths = ["./UI-dist/flightsSmall.sqlite"];
// const workerDbPaths: string[] = undefined;
const dielPrefix = "./src/notebook/tests/";
const dielFiles = [
  // the following are local
  // fixme: make simple and counter-worker have different names...
  // `${dielPrefix}simple.diel`,
  // `${dielPrefix}linked-bar-charts.diel`,
  `${dielPrefix}single-bar-chart-zoom.diel`,
  // the following are remotes
  `${dielPrefix}pitchfork.diel`,
  `${dielPrefix}flights-worker.diel`,
];
const mainDbPath = "./UI-dist/test.db";

const socketConnections = [{url: "ws://localhost:8999", dbName: "pitchfork"}];
// const socketConnections: any = null;

export const diel = new DielRuntime({
  dielFiles,
  mainDbPath,
  workerDbPaths,
  socketConnections
});