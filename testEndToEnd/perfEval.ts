import { testStudentDb } from "./studentTest";
import { DielRuntime } from "../src";

// this file evaluates the performance by stress testing DIEL and reporting the numbers

// we want to do a minial one that's otherwise super fast, just to see the overhead of DIEL
export function baseLineEval(perf: (diel: DielRuntime) => void) {
  testStudentDb(perf);
  // print the results
}

// then a more complex one, and toggle on and off the caching and materialization

