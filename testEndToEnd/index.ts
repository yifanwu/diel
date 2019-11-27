import { testStudentDb } from "./studentTest";
import { testRangeCaching, testMultiTableCaching } from "./performanceTest/testComplexCaching";
import { baseLineEval } from "./perfEval";
import { sensorTest } from "./sensorTest";
import { sensorTestPostgresConnection } from "./sensorTestPostgres";
import { sensorsPerformanceTest } from "./performanceTest/sensorsPerformanceTest";
import { materializeTest } from "./performanceTest/materializeTest";
import { materializeTriggerOrder } from "./materializeTriggerOrder";
import { materializeComplex } from "./materializeComplex";
import { burstyTest } from "./performanceTest/burstyTest";
import { multipleConnectionTest } from "./multipleConnectionTest";
import { DielRuntime } from "../src";

const NUM_LOOPS = 1;


const perf = (diel: DielRuntime) => {
  diel.inspectQueryResult(`select * from __perf`);
  diel.downloadDB(1);
  diel.ShutDown();
};

// connection Test
// sensorTestPostgresConnection(perf);
// materializeComplex(perf);
// materializeTriggerOrder(perf);
multipleConnectionTest(perf);

// performance Test
// -- materialize
// materializeTest(perf, true);
// materializeTest(perf, false);


// -- bursty (interval, number of loops)
// burstyTest(perf, true, 0, 50);
// burstyTest(perf, false, 500, 10);

// -- cache (interval, number of loops  )

// for (let i = 0; i < NUM_LOOPS; i++) {
//   sensorsPerformanceTest(perf);
// }



// sensorsPerformanceTest(perf);
// sensorTest(perf);

// baseLineEval(perf);
// testMultiTableCaching();
// testRangeCaching();
// testStudentDb();