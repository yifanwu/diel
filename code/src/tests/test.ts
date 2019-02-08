import { assertMultiplyType, assertSimpleType } from "./compilerTests/assertTypes";
// import { testTopologicalSort } from "./unitTest";
import { assertAllStar } from "./compilerTests/testStarExpantion";
import { assertGroupBy } from "./parserTests/expressionsTest";
assertGroupBy();
assertSimpleType();
// testTopologicalSort();
// assertAllStar();
// assertMultiplyType();