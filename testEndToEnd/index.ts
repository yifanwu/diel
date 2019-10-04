import { testStudentDb } from "./studentTest";
import { testRangeCaching, testMultiTableCaching } from "./testComplexCaching";
import { baseLineEval } from "./perfEval";
import { sensorTest } from "./sensorTest";
import { sensorTestPostgres } from "./sensorTestPostgres";
import { DielRuntime } from "../src";

const perf = (diel: DielRuntime) => {
  diel.inspectQueryResult(`select * from __perf`);
  diel.downloadDB(1);
  diel.ShutDown();
};
sensorTestPostgres(perf);
// sensorTest(perf);

// baseLineEval(perf);
// testMultiTableCaching();
// testRangeCaching();
// testStudentDb();