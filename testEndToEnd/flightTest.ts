import * as path from "path";
import { DielRuntime, DbSetupConfig, DbType, RelationObject, DbDriver, RecordObject } from "../src";
import { LogTest } from "../src/util/messages";

const tableDef: RecordObject[] = [];
tableDef.push({
  name: `flights`,
  sql: `CREATE TABLE flights (
    id INT, 
    fl_date INT, 
    dep_time INT, 
    dep_delay INT, 
    arr_time INT, 
    arr_delay INT, 
    air_time INT, 
    distance INT
    )`
});

const dbConfigs: DbSetupConfig[] = [{
    dbType: DbType.Socket,
    connection: "ws://localhost:8999",
    message: {dbName: "kunal"},
    tableDef,
    dbDriver: DbDriver.Postgres
  },
];

const mainDbPath: string = null;
const dielFiles = [path.resolve(__dirname, "../../testEndToEnd/diel/flights-remote.diel")];
const isCaching = false;

export function testFlightDb(perf: (diel: DielRuntime) => void) {

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

    diel.BindOutput("rangeOutput", (o: RelationObject) => {
      LogTest("rangeOutput results!", JSON.stringify(o));
    });

    diel.NewInput("distanceRangeEvent", {min_dist: 1000, max_dist: 1500});
    window.setTimeout(() => {
      console.log("done with first");
      diel.NewInput("distanceRangeEvent", {min_dist: 2000, max_dist: 3000});
      window.setTimeout(() => {
        console.log("done with second");
        diel.NewInput("distanceRangeEvent", {min_dist: 0, max_dist: 200});
      
            // manually wait for like 5 seconds and it should be enough time
    window.setTimeout(() => {
      perf(diel);
    }, 5000);
      }, 3000);
    }, 3000);


  }
  return diel;
}
