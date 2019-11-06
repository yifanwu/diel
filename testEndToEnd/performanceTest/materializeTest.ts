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

const dielFiles2 = [path.resolve(__dirname, "../../testEndToEnd/diel/materializeTriggerOrder.diel")];
const dielFiles1 = [path.resolve(__dirname, "../../testEndToEnd/diel/materialize.diel")];


export function materializeTest(perf: (diel: DielRuntime) => void, materialize?: boolean) {
  const diel = new DielRuntime({
    isStrict: true,
    showLog: true,
    setupCb: testClass2,
    caching: false,
    dielFiles: dielFiles2,
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

    for (let i = 0; i < 10; i++) {
      diel.NewInput("time_selection", {minTs: 1541878513, maxTs: 1541886987});
    }
  }

    async function testClass2() {
      // v1 should get updated first and then v2
      // create triggers in an alphabetical order
      diel.BindOutput("pack_break_regen_first", (o: RelationObject) => {
        console.log(`%c pack_break_regen_first`, "color: green");
      });
      diel.BindOutput("pack_break_regen_second", (o: RelationObject) => {
        console.log(`%c pack_break_regen_second`, "color: green");
      });
      diel.BindOutput("pack_break_regen_third", (o: RelationObject) => {
        console.log(`%c pack_break_regen_third`, "color: green");
      });

      diel.NewInput("time_selection", {minTs: 1541878513, maxTs: 1541886987});
    }
  return diel;
}