import * as path from "path";
import { DielRuntime, DbType, DbSetupConfig, DbDriver, RelationObject, RecordObject } from "../src";

let requestStart = 0;
let requestEnd = 0;

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

// tableDef.push({
//   name: `bigdata`,
//   sql: `create table bigdata (
//       num INT
//   )`
// });

// For test 1to10.diel
// tableDef.push({
//   name: `test`,
//   sql: `create table test (
//       num INT
//   )`
// });

tableDef.push({
  name: `realistic`,
  sql: `create table realistic (
    uuid INT,
    year INT,
    major INT,
    gpa FLOAT,
    resident INT
  )`
});

// tableDef.push({
//   name: `realisticstring`,
//   sql: `create table realisticstring (
//     name TEXT,
//     year INT,
//     major TEXT,
//     gpa FLOAT,
//     resident INT
//   )`
// });

const dbConfigs: DbSetupConfig[] = [{
  dbType: DbType.Socket,
  dbDriver: DbDriver.Postgres,
  connection: "ws://localhost:8999",
  message: {dbName: "eval"},
  tableDef,
},
];

// const dielFiles = [path.resolve(__dirname, "../testEndToEnd/diel/eval.diel")];
const dielFiles = [path.resolve(__dirname, "../testEndToEnd/diel/realistic.diel")];


export function evalTestPostgres(perf: (diel: DielRuntime) => void, bursty: boolean, numBursts: number) {
  const diel = new DielRuntime({
    isStrict: true,
    showLog: true,
    setupCb: bursty ? burstyWorkload : singleWorkload,
    caching: false,
    dielFiles: dielFiles,
    mainDbPath: null,
    dbConfigs,
    materialize: true,
  });

  async function singleWorkload() {
    diel.BindOutput("eval_out", (o: RelationObject) => {
        requestEnd = performance.now();
        diel.logEndTime(requestEnd);
        console.log("Output table is ", o);
        diel.downloadE2EPerformance(false);
    });

  
    requestStart = performance.now();
    // console.log("START TIME IS: ", requestStart);
    
    // diel.NewInput("boundaries", {minNum: 5, maxNum: 1000});
    // diel.NewInput("boundaries", {minNum: 50, maxNum: 100});
    

    // diel.NewInput("boundary", {val: 1});
    // diel.NewInput("boundary", {val: 2});

    diel.NewInput("boundaries", {minNum: 1, maxNum: 3});
    diel.logStartTime(requestStart);
    // diel.NewInput("boundaries", {minNum: 2, maxNum: 50000}); // for ford testing
  }

  async function burstyWorkload() {
    let responseNum = 0;
    diel.BindOutput("eval_out", (o: RelationObject) => {
        requestEnd = performance.now();
        responseNum += 1;
        diel.logEndTime(requestEnd);
        console.log("Output table is ", o);
        if (responseNum == numBursts) {
          diel.downloadE2EPerformance(true);
        }
    });

    for (let i = 0; i < numBursts; i++) {
      let min = Math.floor(Math.random() * 100);
      let max = Math.floor(Math.random() * 900 + 101);
      requestStart = performance.now();
      
      diel.NewInput("boundaries", {minNum: min, maxNum: max});
      diel.logStartTime(requestStart);
    }
  }

  return diel;
}