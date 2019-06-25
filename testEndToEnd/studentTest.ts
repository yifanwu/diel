import * as path from "path";
import { DielRuntime, DbSetupConfig, DbType, RelationObject } from "../src";
import { LogInternalError, LogTest, LogInternalWarning } from "../src/util/messages";

const jsFile = path.resolve(__dirname, "../../..//node_modules/sql.js/dist/worker.sql-wasm.js");

const dbConfigs: DbSetupConfig[] = [{
    dbType: DbType.Worker,
    jsFile,
    dataFile: path.resolve(__dirname, "../../testEndToEnd/data/students.sqlite")
  },
];

// data in students.sqlite
// students
// Alice|1
// Bob|2
// Charlie|3
// Dan|4
// Ellis|5
// exam
// 1|50
// 2|85
// 3|99
// 4|12
// 5|100

const mainDbPath: string = null;
const dielFiles = [path.resolve(__dirname, "../../testEndToEnd/diel/students.diel")];
const isCaching = true;

const answerByRequestTimestep = new Map<string, number>();
// timesteps start on 2 since the first 1 is used at setup time
answerByRequestTimestep.set("Alice", 50);
answerByRequestTimestep.set("Bob", 85);
answerByRequestTimestep.set("Charlie", 99);

export function testStudentDb(perf: (diel: DielRuntime) => void) {

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

    diel.BindOutput("grade_result", (o: RelationObject) => {
      LogTest("results!", JSON.stringify(o));
      if (o.length !== 1) {
        LogInternalError(`We expected only one result`);
      }
      const result = o[0]["grade"];
      const answer = answerByRequestTimestep.get(o[0]["student"] as string);
      if (result !== answer) {
        LogInternalWarning(`We expected ${answer} but got ${result} instead`);
      }
    });

    diel.NewInput("name_choice", {first_name: "Alice"});
    // window.setTimeout(() => {
    diel.NewInput("name_choice", {first_name: "Bob"});
    diel.NewInput("name_choice", {first_name: "Charlie"});
    diel.NewInput("name_choice", {first_name: "Alice"});
    diel.NewInput("name_choice", {first_name: "Charlie"});
    // }, 1000);
    // window.setTimeout(() => {
    //   diel.NewInput("name_choice", {first_name: "Alice"});
    // }, 1000);
    // manually wait for like 5 seconds and it should be enough time
    window.setTimeout(() => {
      perf(diel);
    }, 5000);
  }
  return diel;
}
