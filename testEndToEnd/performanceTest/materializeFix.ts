import * as path from "path";
import { DielRuntime, DbType, DbSetupConfig, DbDriver, RelationObject, RecordObject } from "../../src";


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

const dielFiles = [path.resolve(__dirname, "../../testEndToEnd/diel/materializeFix.diel")];


export function materializeFixTest(perf: (diel: DielRuntime) => void, materialize?: boolean) {
  const diel = new DielRuntime({
    isStrict: true,
    showLog: true,
    setupCb: testClass1,
    caching: false,
    dielFiles: dielFiles,
    mainDbPath: null,
    dbConfigs,
    materialize: materialize ? materialize : false,
  });

  async function testClass1() {
    diel.BindOutput("pack_break_regen_first", (o: RelationObject) => {
      console.log(`%c pack_break_regen_first`, "color: green");
    });
    diel.BindOutput("pack_break_regen_second", (o: RelationObject) => {
      console.log(`%c pack_break_regen_second`, "color: green");
    });
    diel.NewInput("time_selection", {minTs: 1541878513, maxTs: 1541886987});

  }
  return diel;
}