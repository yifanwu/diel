import * as path from "path";
import { DielRuntime, DbSetupConfig, DbType, RelationObject } from "../src";
import { LogTest } from "../src/util/messages";
const jsFile = path.resolve(__dirname, "../../..//node_modules/sql.js/dist/worker.sql.js");


const dbConfigs: DbSetupConfig[] = [{
    dbType: DbType.Worker,
    jsFile,
    dataFile: path.resolve(__dirname, "../../testEndToEnd/data/students.sqlite")
  },
];

const mainDbPath: string = null;
const isCaching = true;

export function testRangeCaching() {
  const dielFiles = [path.resolve(__dirname, "../../testEndToEnd/diel/students_range.diel")];
  const diel = new DielRuntime({
    isStrict: true,
    showLog: true,
    setupCb: testClass,
    caching: isCaching,
    dielFiles,
    mainDbPath,
    dbConfigs,
  });

  async function testClass() {
    console.log(`Cache test with${isCaching ? "" : " no"} caching starting`);

    diel.BindOutput("current_matching_students", (o: RelationObject) => {
      LogTest("results!", JSON.stringify(o));
    });

    diel.NewInput("score_range", {low: 10, high: 80});
    diel.NewInput("score_range", {low: 70, high: 90});
    diel.NewInput("score_range", {low: 70, high: 90});
    diel.NewInput("score_range", {low: 10, high: 80});
  }
}


export function testMultiTableCaching() {
  const dielFiles = [path.resolve(__dirname, "../../testEndToEnd/diel/student_range_multi.diel")];
  const diel = new DielRuntime({
    isStrict: true,
    showLog: true,
    setupCb: testClass,
    caching: isCaching,
    dielFiles,
    mainDbPath,
    dbConfigs,
  });

  async function testClass() {
    console.log(`Cache test with${isCaching ? "" : " no"} caching starting`);

    // diel.BindOutput("current_matching_students2", (o: RelationObject) => {
    //   LogTest("results!", JSON.stringify(o));
    // });

    diel.NewInput("score_low", {val: 10});
    diel.NewInput("score_high", {val: 70});
    diel.NewInput("score_low", {val: 20});
    diel.NewInput("score_low", {val: 10});
  }
}