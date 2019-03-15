import DielRuntime from "../runtime/DielRuntime";
import { DEMO_WITH_SOCKET, DEMO_WITH_SMALL_WEBWORKER, DEMO_WITH_LARGE_WEBWORKER, DEMO_WITH_WEBWORKER } from "../compiler/config";

const workerDbPaths = DEMO_WITH_SMALL_WEBWORKER
  ? ["./UI-dist/flightsSmall.sqlite"]
  : DEMO_WITH_LARGE_WEBWORKER
    ? ["./UI-dist/flights.sqlite"]
    : null;

const dielPrefix = "./src/notebook/tests/";

const dielFiles = [
  // the following are local
  `${dielPrefix}simple.diel`,
  `${dielPrefix}single-bar-chart-zoom.diel`,

  // following are webworkers
  ...(DEMO_WITH_WEBWORKER ? [`${dielPrefix}flights-worker.diel`] : []),

  // the following are socket based remotes (requires running `server.ts`)
  ...(DEMO_WITH_SOCKET ? [`${dielPrefix}pitchfork.diel`] : []),
];
const mainDbPath = "./UI-dist/test.db";

const socketConnections = DEMO_WITH_SOCKET
  ? [{url: "ws://localhost:8999", dbName: "pitchfork"}]
  : null;

export const diel = new DielRuntime({
  dielFiles,
  mainDbPath,
  workerDbPaths,
  socketConnections
});