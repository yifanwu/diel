import * as path from "path";

import { DielRuntime, DbSetupConfig, DbType, RelationObject } from "../src";
import { LocalDbId } from "../build/src/compiler/DielPhysicalExecution";

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

const dielFiles = [path.resolve(__dirname, "../../testEndToEnd/diel/simple.diel")];
// const dielFiles = [path.resolve(__dirname, "../../testEndToEnd/diel/flights-remote.diel")];

export const diel = new DielRuntime({
  isStrict: true,
  showLog: true,
  setupCb: runTest,
  dielFiles,
  mainDbPath,
  dbConfigs,
});

// runt time testing

async function runTest() {
  console.log("DIEL runtime test starting");
  // make assertions about the setup
  // e.g. the ASTs in diel.physicalExecution

  // bind custom outputs
  diel.BindOutput("currentOriginSelection", (o: RelationObject) => {
    console.log("bindoutput results!", o);
  });
  // diel.physicalExecution.getAstFromDbId(LocalDbId)
  // change runtime values
  // diel.NewInput("zoomScatterItx", {minDelay: 0, maxDelay: 100, minDistance: 0, maxDistance: 800});
  diel.NewInput("originSelectionEvent", {origin: "LAX"});

  // AssertDefaultAsyncPolicy
  // at this point we know that the flights table is remote.
  // we are going to create an output

  // let's try adding dynamically
  const rName = await diel.AddOutputRelationByString(`
    select distinct origin from flights where delay > 500;
  `);
  diel.BindOutput(rName, (data: RelationObject) => {
    console.log("AddOutputRelationByString function returned data", data);
  });
}
