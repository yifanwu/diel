import * as path from "path";
import { DielRuntime, DbType, DbSetupConfig, DbDriver, RelationObject, RecordObject } from "../../src";


const tableDef: RecordObject[] = [];
tableDef.push({
  name: `log`,
  sql: `CREATE TABLE log (
    time INT,
    device TEXT,
    value INT,
    min INT,
    max INT,
    data TEXT,
    message TEXT,
    source TEXT,
    ts INT
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
// test with the local db

const dielFiles = [path.resolve(__dirname, "../../testEndToEnd/diel/sensors.diel")];

export function burstyTest(perf: (diel: DielRuntime) => void, bursty: boolean, interval: number, numLoop: number) {
    const diel = new DielRuntime({
        isStrict: true,
        showLog: true,
        setupCb: bursty ? testClassburstySameRange : testClassNotBursty ,
        caching: true,
        dielFiles,
        mainDbPath: null,
        dbConfigs,
      });

    // log data falls in between "1541878513" and "1541886987"
    async function testClassburstySameRange() {
        diel.BindOutput("pack_break_regen", (o: RelationObject) => {
            console.log("\x1b[43m", "pack_break_regen", "\x1b[0m", o);
        });
        // bursty selections with same selection
        for (let i = 0; i < numLoop; i++) {
            diel.NewInput("time_selection", {minTs: 1541878513, maxTs: 1541886987});
        }
    }

    // async function testClassburstyDiffRange() {
    //     diel.BindOutput("pack_break_regen", (o: RelationObject) => {
    //         console.log("pack_break_regen", o);
    //     });

    //     // bursty selections with same selection
    //     for (let i = 0; i < numLoop; i++) {
    //         diel.NewInput("time_selection", {minTs: 1541878513 + 100 * i, maxTs: 1541878515 + 100 * i});
    //     }
    // }

    async function testClassNotBursty() {
        diel.BindOutput("pack_break_regen", (o: RelationObject) => {
            console.log("pack_break_regen", o);
        });
        for (let i = 0; i < numLoop; i++) {
            window.setTimeout(() => {
                diel.NewInput("time_selection", {minTs: 1541878513, maxTs: 1541886987});
            }, interval);
        }
    }

    return diel;
}