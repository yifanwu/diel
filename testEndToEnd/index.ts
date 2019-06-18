import { testStudentDb } from "./studentTest";
import { testRangeCaching, testMultiTableCaching } from "./testComplexCaching";
import { baseLineEval } from "./perfEval";

baseLineEval();
// testMultiTableCaching();
// testRangeCaching();
// testStudentDb();