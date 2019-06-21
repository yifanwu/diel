import { testStudentDb } from "./studentTest";
import { testRangeCaching, testMultiTableCaching } from "./testComplexCaching";
import { baseLineEval } from "./perfEval";
import { sensorTest } from "./sensorTest";
import { DielRuntime } from "../src";

const perf = (diel: DielRuntime) => {
  diel.inspectQueryResult(`select * from __perf`);
  diel.downloadDB(1);
  diel.ShutDown();
};
sensorTest(perf);
// baseLineEval(perf);
// testMultiTableCaching();
// testRangeCaching();
// testStudentDb();