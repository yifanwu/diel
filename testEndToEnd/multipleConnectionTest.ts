import * as path from "path";
import { DielRuntime, DbType, DbSetupConfig, DbDriver, RelationObject, RecordObject } from "../src";


const tableDef: RecordObject[] = [];
// tableDef.push({
//   name: `t2`,
//   sql: `CREATE TABLE t2 (
//       a INT
//     )`
// });

const dbConfigs: DbSetupConfig[] = [
    {
        dbType: DbType.Socket,
        dbDriver: DbDriver.SQLite,
        connection: "ws://localhost:8999",
        message: {dbName: "remote_db1"},
        tableDef,
    }, {
        dbType: DbType.Socket,
        dbDriver: DbDriver.SQLite,
        connection: "ws://localhost:9000",
        message: {dbName: "remote_db2"},
        tableDef,
    }
];

const dielFiles = [path.resolve(__dirname, "../testEndToEnd/diel/multipleConnection.diel")];


export function multipleConnectionTest(perf: (diel: DielRuntime) => void) {
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
    diel.BindOutput("o", (o: RelationObject) => {
      console.log(`\x1b[42m%s\x1b[0m`, "OUTPUT O");
      o.forEach(v => {
        console.log(v);
      });
    });
    diel.NewInput("t0", {a: 5});
  }
  return diel;
}