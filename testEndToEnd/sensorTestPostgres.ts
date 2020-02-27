import * as path from "path";
import { DielRuntime, DbType, DbSetupConfig, DbDriver, RelationObject, RecordObject } from "../src";


const tableDef: RecordObject[] = [];
tableDef.push({
  name: `log`,
  sql: `CREATE TABLE log (
    time INT,
    device TEXT,
    value INT,
    min INT,
    max INT,
    data TEXT,
    message TEXT,
    source TEXT,
    ts INT
  )`
});

const dbConfigs: DbSetupConfig[] = [{
  dbType: DbType.Socket,
  dbDriver: DbDriver.Postgres,
  connection: "ws://localhost:8999",
  message: {dbName: "sensors"},
  tableDef,
},
];

const dielFiles = [path.resolve(__dirname, "../../testEndToEnd/diel/sensors.diel")];

export function sensorTestPostgresConnection(perf: (diel: DielRuntime) => void) {
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
    
    window.setTimeout(() => {
      // perf(diel);
      // console.log("done with first");
      diel.NewInput("time_selection", {minTs: 1541878513, maxTs: 1541878515});
    }, 5000);
    
    

  }
  return diel;
}