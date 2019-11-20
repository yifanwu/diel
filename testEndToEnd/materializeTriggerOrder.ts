import * as path from "path";
import { DielRuntime, DbType, DbSetupConfig, DbDriver, RelationObject, RecordObject } from "../src";


const tableDef: RecordObject[] = [];

const dbConfigs: DbSetupConfig[] = [{
  dbType: DbType.Socket,
  dbDriver: DbDriver.SQLite,
  connection: "ws://localhost:8999",
  message: {dbName: "sensors"},
  tableDef,
},
];

const dielFiles = [path.resolve(__dirname, "../testEndToEnd/diel/materializeTriggerOrder.diel")];


export function materializeTriggerOrder(perf: (diel: DielRuntime) => void) {
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
      console.log(`\x1b[42m%s\x1b[0m`, "OUTPUT O1");
      o.forEach(v => {
        console.log(v);
      });
    });

    diel.BindOutput("o2", (o: RelationObject) => {
      console.log(`\x1b[43m%s\x1b[0m`, "OUTPUT O2");
      o.forEach(v => {
        console.log(v);
      });
    });

    diel.BindOutput("o3", (o: RelationObject) => {
      console.log(`\x1b[41m%s\x1b[0m`, "OUTPUT O3");
      o.forEach(v => {
        console.log(v);
      });
    });
    diel.NewInput("t1", {a: 5});
  }
  return diel;
}