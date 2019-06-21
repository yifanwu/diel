import * as path from "path";
import { DielRuntime, DbSetupConfig, DbType, RelationObject } from "../src";
import { LogInternalError, LogTest, LogInternalWarning } from "../src/util/messages";

const jsFile = path.resolve(__dirname, "../../..//node_modules/sql.js/js/worker.sql.js");

const dbConfigs: DbSetupConfig[] = [{
    dbType: DbType.Worker,
    jsFile,
    dataFile: path.resolve(__dirname, "../../testEndToEnd/data/sensors_10000.sqlite")
  },
];

const mainDbPath: string = null;
const dielFiles = [path.resolve(__dirname, "../../testEndToEnd/diel/sensors.diel")];

export function sensorTest(perf: (diel: DielRuntime) => void) {

  const diel = new DielRuntime({
    isStrict: true,
    showLog: true,
    setupCb: testClass,
    caching: false,
    dielFiles,
    mainDbPath,
    dbConfigs,
  });

  async function testClass() {
    diel.BindOutput("current_time_selection_pretty", (o: RelationObject) => {
      console.log("current_time_selection_pretty", o);
    });
    diel.BindOutput("pack_ther", (o: RelationObject) => {
      console.log("pack_ther", o);
    });
    diel.BindOutput("pack_cell", (o: RelationObject) => {
      console.log("pack_cell", o);
    });
    diel.NewInput("time_selection", {minTs: null, maxTs: null});
    diel.NewInput("time_selection", {minTs: 2458433.3161339, maxTs: 2458433.36517046});
    // window.setTimeout(() => {
    //   perf(diel);
    // }, 5000);
  }
  return diel;
}
