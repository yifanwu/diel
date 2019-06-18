import { testStudentDb } from "./studentTest";

// this file evaluates the performance by stress testing DIEL and reporting the numbers

// we want to do a minial one that's otherwise super fast, just to see the overhead of DIEL
export function baseLineEval() {
  const diel = testStudentDb();
  // print the results
  diel.inspectQueryResult(`select * from __perf`);
  diel.downloadDB(1);
  diel.ShutDown();
}

// then a more complex one, and toggle on and off the caching and materialization

