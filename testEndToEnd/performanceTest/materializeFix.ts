import * as path from "path";
import { DielRuntime, DbType, DbSetupConfig, DbDriver, RelationObject, RecordObject } from "../../src";


const tableDef: RecordObject[] = [];
tableDef.push({
  name: `t2`,
  sql: `CREATE TABLE t2 (
      a INT
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
    materialize: true,
  });

  async function testClass1() {
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
    diel.NewInput("t1", {a: 2});
    diel.NewInput("t1", {a: 8});

  }
  return diel;
}