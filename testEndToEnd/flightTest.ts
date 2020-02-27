import * as path from "path";
import { DielRuntime, DbSetupConfig, DbType, RelationObject } from "../src";
import { LogInternalError, LogTest, LogInternalWarning } from "../src/util/messages";

const dbConfigs: DbSetupConfig[] = [{
    dbType: DbType.Socket,
    connection: "ws://localhost:8999",
    message: {dbName: "kunal"}
  },
];

const mainDbPath: string = null;
const dielFiles = [path.resolve(__dirname, "../../testEndToEnd/diel/flights-remote.diel")];
const isCaching = true;

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

    diel.NewInput("distanceRangeEvent", {minDist: 1000, maxDist: 10000});

    // manually wait for like 5 seconds and it should be enough time
    window.setTimeout(() => {
      perf(diel);
    }, 5000);
  }
  return diel;
}
