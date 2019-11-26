import * as path from "path";
import { DielRuntime, DbSetupConfig, DbType, RelationObject, DbDriver } from "../src";
import { LogInternalError, LogTest, LogInternalWarning } from "../src/util/messages";

const jsFile = path.resolve(__dirname, "../../..//node_modules/sql.js/js/worker.sql.js");

const dbConfigs: DbSetupConfig[] = [{
    dbType: DbType.Worker,
    jsFile,
    dataFile: path.resolve(__dirname, "../../testEndToEnd/data/eval.sqlite"),
    dbDriver: DbDriver.SQLite
  },
];

const mainDbPath: string = null; // Type your sqlite db file path here to inject into maindb on browser
const dielFiles = [path.resolve(__dirname, "../../testEndToEnd/diel/eval.diel")];

let requestStart = 0;
let requestEnd = 0;


export function evalTestSqlite(perf: (diel: DielRuntime) => void, bursty: boolean, numBursts: number) {

  const diel = new DielRuntime({
    isStrict: true,
    showLog: true,
    setupCb: bursty ? burstyWorkload : singleWorkload,
    caching: false,
    dielFiles,
    mainDbPath,
//   dbConfigs,
  });

  async function singleWorkload() {
    diel.BindOutput("eval_out", (o: RelationObject) => {
        requestEnd = performance.now();
        console.log("eval_out", o);
        diel.downloadE2EPerformance(requestStart, requestEnd);
    });

    requestStart = performance.now();
    diel.NewInput("boundaries", {minNum: 5, maxNum: 1000});
  }

  async function burstyWorkload() {
    let responseNum = 0;

    diel.BindOutput("eval_out", (o: RelationObject) => {
        requestEnd = performance.now();
        responseNum += 1;
        console.log("eval_out", o);

        if (responseNum == numBursts) {
            diel.downloadE2EPerformance(requestStart, requestEnd);
        }
    });

    requestStart = performance.now();

    for (let i = 0; i < numBursts; i++) {
        diel.NewInput("boundaries", {minNum: 1, maxNum: 1000});
    }
  }
  return diel;
}
