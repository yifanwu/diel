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

// @Lucie Todo: add another field for table definitions.
// make developers put diel queries
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
  });

  async function testClass() {
    diel.BindOutput("o1", (o: RelationObject) => {
      // document.write("<html><body><h2>Added!!!!</h2></body></html>");
      console.log("\nBIND OUTPUT-O1!\n", o);
    });
    diel.BindOutput("o2", (o: RelationObject) => {
      // document.write("<html><body><h2>Added!!!!</h2></body></html>");
      console.log("\nBIND OUTPUT-O2!\n", o);
    });

    diel.NewInput("value_selection", {selectedVal: 10});

    diel.NewInput("value_selection", {selectedVal: 0});
  }
  return diel;
}