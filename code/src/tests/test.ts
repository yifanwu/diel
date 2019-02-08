import { assertSimpleType } from "./compilerTests/assertTypes";
// import { testTopologicalSort } from "./unitTest";
import { assertBasicNormalizationOfRelation } from "./compilerTests/assertNormalization";
import { assertBasicOperators } from "./parserTests/basicOperatorsTest";

assertBasicOperators();
assertBasicNormalizationOfRelation();
// assertGroupBy();
assertSimpleType();
// testTopologicalSort();
// assertAllStar();
// assertMultiplyType();