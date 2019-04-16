import * as path from "path";

import { DielRuntime, DbSetupConfig, DbType, RelationObject } from "../src";

/**
 * LUCIE TODO:
 * - put the worker.sql.js file into endToEnd
 * - put the data (.sqlite files) into the /data dir (cp from diel-gallery)
 * - put the .diel into the current dir (cp from diel-gallery)
 */

const jsFile = path.resolve(__dirname, "../../..//node_modules/sql.js/js/worker.sql.js");

const dbConfigs: DbSetupConfig[] = [
  {
    dbType: DbType.Worker,
    jsFile,
    dataFile: path.resolve(__dirname, "../../testEndToEnd/data/flights.small.sqlite")
  },
];

const mainDbPath: string = null;

const dielFiles = [path.resolve(__dirname, "../../testEndToEnd/diel/flights-remote.diel")];

export const diel = new DielRuntime({
  isStrict: true,
  showLog: true,
  setupCb: runTest,
  dielFiles,
  mainDbPath,
  dbConfigs,
});

// runt time testing

function runTest() {
  console.log("DIEL runtime test starting");
  // make assertions about the setup
  // e.g. the ASTs in diel.physicalExecution

// bind custom outputs
  diel.BindOutput("allOriginAirports", (o: RelationObject) => {
    // assert the values here!
  });

  // change runtime values
  diel.NewInput("zoomScatterItx", {minDelay: 0, maxDelay: 100, minDistance: 0, maxDistance: 800});

}