import DielRuntime from "../runtime/DielRuntime";
import { DEMO_WITH_SOCKET, DEMO_WITH_SMALL_WEBWORKER, DEMO_WITH_LARGE_WEBWORKER, DEMO_WITH_WEBWORKER } from "../compiler/config";

const dbPathPrefix = "./UI-dist/data/";

const flightWorkerDbPaths = DEMO_WITH_SMALL_WEBWORKER
  ? [`${dbPathPrefix}flights.small.sqlite`]
  : DEMO_WITH_LARGE_WEBWORKER
    ? [`${dbPathPrefix}flights.large.sqlite`]
    : null;

const workerDbPaths = [
    `${dbPathPrefix}fires.sqlite`,
    `${dbPathPrefix}pitchfork.large.sqlite`,
  ].concat(flightWorkerDbPaths);

const dielPrefix = "./src/notebook/dielSpec/";

const dielFiles = [
  // the following are local
  `${dielPrefix}counter.diel`,
  `${dielPrefix}undo.diel`,
  // following are webworkers, and they all have smaller equivalents with sockets
  ...(DEMO_WITH_WEBWORKER
    ? [
        `${dielPrefix}flights-remote.diel`,
        `${dielPrefix}fires-remote.diel`,
        `${dielPrefix}pitchfork-remote.diel`
      ]
    : []),
    ...(DEMO_WITH_SOCKET
      ? [
          `${dielPrefix}flights-remote.diel`
        ]
      : []),
];

const mainDbPath = `${dbPathPrefix}score.sqlite`;
// const mainDbPath: string = null;

const socketConnections = DEMO_WITH_SOCKET
  ? [{url: "ws://localhost:8999", dbName: "flights"}]
  : null;

export const diel = new DielRuntime({
  dielFiles,
  mainDbPath,
  workerDbPaths,
  socketConnections
});