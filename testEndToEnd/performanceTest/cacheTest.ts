import * as path from "path";
import { DielRuntime, DbSetupConfig, DbType, RelationObject, DbDriver } from "../../src";
import { LogInternalError, DielInternalErrorType } from "../../src/util/messages";

const jsFile = path.resolve(__dirname, "../../..//node_modules/sql.js/js/worker.sql.js");

const dbConfigs: DbSetupConfig[] = [{
    dbType: DbType.Worker,
    jsFile,
    dataFile: path.resolve(__dirname, "../../testEndToEnd/data/cache.sqlite"),
    dbDriver: DbDriver.SQLite
  },
];

const mainDbPath: string = null;
const dielFiles = [path.resolve(__dirname, "../../testEndToEnd/diel/cache.diel")];
const isCaching = true;

const answerByRequestTimestep = new Map<number, number>();
// timesteps start on 2 since the first 1 is used at setup time
answerByRequestTimestep.set(2, 50);
answerByRequestTimestep.set(3, 85);
answerByRequestTimestep.set(4, 50);

export function testSimpleCache() {

  const diel = new DielRuntime({
    isStrict: true,
    showLog: true,
    setupCb: testCache,
    caching: isCaching,
    dielFiles,
    mainDbPath,
    dbConfigs,
  });

async function testCache() {
   console.log(`Cache test with${isCaching ? "" : " no"} caching starting`);

   diel.BindOutput("o1", (o: RelationObject) => {
      console.log("results!", o);
   });

   diel.NewInput("click", {num: 10});
   diel.NewInput("slider", {position: 105});
   diel.NewInput("slider", {position: 103});
   diel.NewInput("slider", {position: 109});

    /*
   const rName = await diel.AddOutputRelationByString(`
     select datum from data; 
   `);
   */
 }
}
