import * as path from "path";
import { DielRuntime, DbType, DbSetupConfig, DbDriver, RelationObject } from "../src";

// const jsFile = "./node_modules/sql.js/js/worker.sql.js";

const dbConfigs: DbSetupConfig[] = [{
  dbType: DbType.Socket,
  dbDriver: DbDriver.Postgres,
  connection: "ws://localhost:8999",
  message: {dbName: "sensors"}
},
];

const dielFiles = [path.resolve(__dirname, "../../testEndToEnd/diel/sensors.diel")];

export function sensorTestPostgres(perf: (diel: DielRuntime) => void) {
  const diel = new DielRuntime({
    isStrict: true,
    showLog: true,
    setupCb: testClass,
    caching: false,
    dielFiles,
    mainDbPath: null,
    dbConfigs,
  });

  async function testClass() {
    // diel.BindOutput("current_time_selection_pretty", (o: RelationObject) => {
    //   console.log("current_time_selection_pretty", o);
    // });
    diel.BindOutput("pack_break_regen", (o: RelationObject) => {
      console.log("pack_break_regen", o);
    });
    // diel.BindOutput("pack_ther", (o: RelationObject) => {
    //   console.log("pack_ther", o);
    // });
    // diel.BindOutput("pack_cell", (o: RelationObject) => {
    //   console.log("pack_cell", o);
    // });
    diel.NewInput("time_selection", {minTs: null, maxTs: null});
    diel.NewInput("time_selection", {minTs: 2458433.3161339, maxTs: 2458433.36517046});
    // window.setTimeout(() => {
    //   perf(diel);
    // }, 5000);
  }
  return diel;
}