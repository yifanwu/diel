import * as path from "path";
import { DielRuntime, DbType, DbSetupConfig, DbDriver, RelationObject, RecordObject } from "../src";


const tableDef: RecordObject[] = [];
// tableDef.push({
//   name: `log`,
//   sql: `CREATE TABLE log (
//     time INT,
//     device TEXT,
//     value INT,
//     min INT,
//     max INT,
//     data TEXT,
//     message TEXT,
//     source TEXT,
//     ts INT
//   )`
// });

const dbConfigs: DbSetupConfig[] = [{
  dbType: DbType.Socket,
  dbDriver: DbDriver.SQLite,
  connection: "ws://localhost:8999",
  message: {dbName: "sensors"},
  tableDef,
},
];

const dielFiles = [path.resolve(__dirname, "../testEndToEnd/diel/materializeTriggerOrder.diel")];


export function materializeE2ETest(perf: (diel: DielRuntime) => void) {
  const diel = new DielRuntime({
    isStrict: true,
    showLog: true,
    setupCb: testClass,
    caching: false,
    dielFiles: dielFiles,
    mainDbPath: null,
    dbConfigs,
    materialize: true,
  });

  async function testClass() {
    diel.BindOutput("o1", (o: RelationObject) => {
      console.log(`%c BINDING O1`, "color: green");
    });
    diel.BindOutput("o2", (o: RelationObject) => {
      console.log(`%c BINDING O2`, "color: green");
    });

  }
  return diel;
}