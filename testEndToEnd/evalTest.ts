import * as path from "path";
import { DielRuntime, DbType, DbSetupConfig, DbDriver, RelationObject, RecordObject } from "../src";
import { SSL_OP_NO_TLSv1_2 } from "constants";


const tableDef: RecordObject[] = [];
tableDef.push({
  name: `eval`,
  sql: `CREATE TABLE eval (
      num INT
    )`
});

const dbConfigs: DbSetupConfig[] = [{
  dbType: DbType.Socket,
  dbDriver: DbDriver.Postgres,
  connection: "ws://localhost:8999",
  message: {dbName: "eval"},
  tableDef,
},
];

const dielFiles = [path.resolve(__dirname, "../testEndToEnd/diel/eval.diel")];


export function evalTest(perf: (diel: DielRuntime) => void) {
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
    diel.BindOutput("eval_out", (o: RelationObject) => {
        console.log("END TIME IS " + performance.now());
        console.log("Output table is ", o);
    });

    console.log("START TIME IS " + performance.now());
    diel.NewInput("boundaries", {minNum: 2, maxNum: 7});
    diel.NewInput("boundaries", {minNum: 5, maxNum: 10});
    diel.NewInput("boundaries", {minNum: 1, maxNum: 3});
    diel.NewInput("boundaries", {minNum: 4, maxNum: 5});
    diel.NewInput("boundaries", {minNum: 3, maxNum: 10});
    diel.NewInput("boundaries", {minNum: 1, maxNum: 10});
  }


  return diel;
}