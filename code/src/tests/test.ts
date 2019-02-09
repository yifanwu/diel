import { assertSimpleType, assertMultiplyType } from "./compilerTests/assertTypes";
// import { testTopologicalSort } from "./unitTest";
import { assertBasicNormalizationOfRelation } from "./compilerTests/assertNormalization";
import { assertBasicOperators } from "./parserTests/basicOperatorsTest";
import { codeGenBasicSQLTest } from "./codeGenTests/sqlTest";
import { assertAllStar } from "./compilerTests/testStarExpantion";

codeGenBasicSQLTest();
assertBasicOperators();
assertBasicNormalizationOfRelation();
assertSimpleType();
// testTopologicalSort();
assertAllStar();
assertMultiplyType();