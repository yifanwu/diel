import { testStudentDb } from "./studentTest";
import { testRangeCaching, testMultiTableCaching } from "./testComplexCaching";
import { baseLineEval } from "./perfEval";
import { sensorTest } from "./sensorTest";
import { DielRuntime } from "../src";
import { testFlightDb } from "./flightTest";

const perf = (diel: DielRuntime) => {
  diel.inspectQueryResult(`select * from __perf`);
  diel.downloadDB(1);
  diel.ShutDown();
};
testFlightDb(perf);
// sensorTest(perf);
// baseLineEval(perf);
// testMultiTableCaching();
// testRangeCaching();
// testStudentDb(perf);
