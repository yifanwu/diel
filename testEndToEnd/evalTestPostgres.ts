import * as path from "path";
import { DielRuntime, DbType, DbSetupConfig, DbDriver, RelationObject, RecordObject } from "../src";
import { SSL_OP_NO_TLSv1_2 } from "constants";

export let requestStart = 0;
export let requestEnd = 0;

const tableDef: RecordObject[] = [];
// tableDef.push({
//   name: `ford`,
//   sql: `create table ford (
//         duration INT,
//         startTime TIMESTAMP,
//         endTime TIMESTAMP,
//         startStationID INT,
//         startStationName TEXT,
//         startStationLat FLOAT,
//         StartStationLong FLOAT,
//         endStationID INT,
//         endStationName TEXT,
//         endStationLat FLOAT,
//         endStationLong FLOAT,
//         bikeID INT,
//         userType TEXT,
//         birthYear TEXT,
//         gender TEXT
//     )`
// });

tableDef.push({
  name: `bigdata`,
  sql: `create table bigdata (
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


export function evalTestPostgres(perf: (diel: DielRuntime) => void, bursty: boolean, numBursts: number) {
  const diel = new DielRuntime({
    isStrict: true,
    showLog: true,
    setupCb: bursty ? burstyWorkload : singleWorkload,
    caching: false,
    dielFiles: dielFiles,
    mainDbPath: null,
    dbConfigs,
    materialize: false,
  });

  async function singleWorkload() {
    diel.BindOutput("eval_out", (o: RelationObject) => {
        requestEnd = performance.now();
        console.log("Output table is ", o);
        // diel.downloadPerformance();
    });


    requestStart = performance.now();
    diel.NewInput("boundaries", {minNum: 5, maxNum: 1000});
    // diel.NewInput("boundaries", {minNum: 2, maxNum: 50000}); // for ford testing
  }

  async function burstyWorkload() {
    diel.BindOutput("eval_out", (o: RelationObject) => {
        requestEnd = performance.now();
        console.log("Output table is ", o);
        // diel.downloadPerformance();
    });

    requestStart = performance.now();

    for (let i = 0; i < numBursts; i++) {
      diel.NewInput("boundaries", {minNum: 1, maxNum: 500});
    }
  }

  return diel;
}