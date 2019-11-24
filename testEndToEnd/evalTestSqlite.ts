import * as path from "path";
import { DielRuntime, DbSetupConfig, DbType, RelationObject, DbDriver } from "../src";
import { LogInternalError, LogTest, LogInternalWarning } from "../src/util/messages";
// import { requestStartGlobal } from "../src/runtime/DielRuntime" 

const jsFile = path.resolve(__dirname, "../../..//node_modules/sql.js/js/worker.sql.js");

const dbConfigs: DbSetupConfig[] = [{
    dbType: DbType.Worker,
    jsFile,
    dataFile: path.resolve(__dirname, "../../testEndToEnd/data/eval.sqlite"),
    dbDriver: DbDriver.SQLite
  },
];

const mainDbPath: string = null;
const dielFiles = [path.resolve(__dirname, "../../testEndToEnd/diel/eval.diel")];

export function evalTestSqlite(perf: (diel: DielRuntime) => void, bursty: boolean, numBursts: number) {

  const diel = new DielRuntime({
    isStrict: true,
    showLog: true,
    setupCb: bursty ? burstyWorkload : singleWorkload,
    caching: false,
    dielFiles,
    mainDbPath,
    dbConfigs,
  });

  async function singleWorkload() {
    diel.BindOutput("eval_out", (o: RelationObject) => {
      console.log("eval_out", o);
    });

    // requestStartGlobal = 0;
    diel.NewInput("boundaries", {minNum: 5, maxNum: 1000});
    // window.setTimeout(() => {
    //   perf(diel);
    // }, 5000);
  }

  async function burstyWorkload() {
    diel.BindOutput("eval_out", (o: RelationObject) => {
      console.log("eval_out", o);
    });

    for (let i = 0; i < numBursts; i++) {
        diel.NewInput("boundaries", {minNum: 1, maxNum: 500});
    }
    // window.setTimeout(() => {
    //   perf(diel);
    // }, 5000);
  }
  return diel;
}
