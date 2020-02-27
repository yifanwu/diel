import { assertSimpleType, assertMultiplyType } from "./compilerTests/assertTypes";
import { testTopologicalSort, testDistributionLogc } from "./unitTest";
import { assertBasicNormalizationOfRelation } from "./compilerTests/assertNormalization";
import { assertBasicOperators } from "./parserTests/basicOperatorsTest";
import { assertAllStar } from "./compilerTests/testStarExpantion";
import { assertBasicConstraints } from "./parserTests/constraintsTest";
import { assertFunctionParsing } from "./parserTests/functionTest";
import { assertLatestSyntax } from "./compilerTests/testSyntaxSugar";
import { codeGenBasicSQLTest } from "./sqlCodeGenTest";
import { testTriTableCreation } from "./testEventTableCacheCreation";
import { testGetOriginalRelationsDependedOn } from "./compilerTests/testDependency";
import { assertCheckViewConstraintTest } from "./compilerTests/testViewConstraints";
import { ParsePlainDielAst, CompileAst } from "../src/compiler/compiler";
import { testAsyncPolicy } from "./compilerTests/testAsyncPolicy";
import { testMaterializationPostgres } from "./compilerTests/testPostgresMaterialization";
import { testMaterialization } from "./compilerTests/testMaterialization";

// // import { PrintCode } from "../src/util/messages";
// testTriTableCreation();
// testAsyncPolicy();
// assertLatestSyntax();
// testAsyncPolicy();
// testTopologicalSort();
// testGetOriginalRelationsDependedOn();
// testDistributionLogc();
// codeGenBasicSQLTest();
// assertBasicOperators();
// assertSimpleType();
// assertAllStar();
// assertMultiplyType();
// const q = `
// create event table t1 (
//   a int,
//   b int
// );
// create event table t2 (
//   c text,
//   b int
// );

// REGISTER UDF testAdd TYPE int;

// create view v1 as select a from t1 join t2 on t1.b = t2.b where c = 'cat';
// create view v2 as select a from t1 join (select max(b) as b from t2) m on m.b = t1.b;
// create view v3 as select a from t1 where b in (select b from t2 where c = 'hello');
// create view v5 as select testAdd(a, b) from t1;
// create view v4 as select datetime(a, 'unixepoch') from t1;
// `;

// let ast = ParsePlainDielAst(q);
// CompileAst(ast);
// assertBasicNormalizationOfRelation(ast, q);
// assertFunctionParsing(ast, q);

// // @LUCIE: the following tests are failing, fix me
// // assertBasicConstraints();
// // assertCheckViewConstraintTest();

// // @LUCIE: the following tests are not defined:
// // testMaterializedViewConstraint();

testMaterialization();
// testMaterializationPostgres();
