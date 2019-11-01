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

const dielFiles = [path.resolve(__dirname, "../../testEndToEnd/diel/materialize.diel")];

export function materializeTest(perf: (diel: DielRuntime) => void) {
  const diel = new DielRuntime({
    isStrict: true,
    showLog: true,
    setupCb: testClass,
    caching: false,
    dielFiles,
    mainDbPath: null,
    dbConfigs,
    materialize: false,
  });

  async function testClass() {
    diel.BindOutput("pack_break_regen_first", (o: RelationObject) => {
      console.log("!!!!!", "pack_break_regen_first!", "!!!!", o);
    });
    diel.BindOutput("pack_break_regen_second", (o: RelationObject) => {
      console.log("?????", "pack_break_regen_second", "????", o);
    });
    diel.NewInput("time_selection", {minTs: null, maxTs: null});
    diel.NewInput("time_selection", {minTs: 1541878513, maxTs: 1541886987});
  }
  return diel;
}