import { testStudentDb } from "./studentTest";
import { testRangeCaching, testMultiTableCaching } from "./testComplexCaching";
import { baseLineEval } from "./perfEval";
import { sensorTest } from "./sensorTest";
import { sensorTestPostgres } from "./sensorTestPostgres";
import { sensorsPerformanceTest } from "./sensorsPerformanceTest";
import { materializeTest } from "./materializeTest";
import { DielRuntime } from "../src";

const NUM_LOOPS = 1;


const perf = (diel: DielRuntime) => {
  diel.inspectQueryResult(`select * from __perf`);
  diel.downloadDB(1);
  diel.ShutDown();
};
// materializeTest(perf);
// sensorTestPostgres(perf);

for (let i = 0; i < NUM_LOOPS; i++) {
  sensorsPerformanceTest(perf);
}



// sensorsPerformanceTest(perf);
// sensorTest(perf);

// baseLineEval(perf);
// testMultiTableCaching();
// testRangeCaching();
// testStudentDb();