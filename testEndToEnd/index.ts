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
import { evalTestPostgres } from "./evalTestPostgres";
import { DielRuntime } from "../src";
import { testFlightDb } from "./flightTest";
import { evalTestSqlite } from "./evalTestSqlite";

const bursty = false;
const numBursts = 2;


const perf = (diel: DielRuntime) => {
  diel.inspectQueryResult(`select * from __perf`);
  diel.downloadDB(1);
  diel.ShutDown();
};
testFlightDb(perf);
// sensorTest(perf);

// connection Test
// sensorTestPostgresConnection(perf);

// evalTestPostgres(perf, bursty, numBursts);
// evalTestSqlite(perf, bursty, numBursts);

// sensorTestPostgresConnection(perf);
// materializeComplex(perf);
// materializeTriggerOrder(perf);

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
// testStudentDb(perf);
