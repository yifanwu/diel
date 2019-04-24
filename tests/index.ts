import { assertSimpleType, assertMultiplyType } from "./compilerTests/assertTypes";
import { testTopologicalSort, testDistributionLogc } from "./unitTest";
import { assertBasicNormalizationOfRelation } from "./compilerTests/assertNormalization";
import { assertBasicOperators } from "./parserTests/basicOperatorsTest";
import { assertAllStar } from "./compilerTests/testStarExpantion";
import { assertBasicConstraints } from "./parserTests/constraintsTest";
import { assertFunctionParsing } from "./parserTests/functionTest";
import { assertLatestSyntax } from "./compilerTests/testSyntaxSugar";
import { codeGenBasicSQLTest } from "./sqlCodeGenTest";
import { testGetOriginalRelationsDependedOn } from "./compilerTests/testDependency";
import { assertCheckViewConstraintTest } from "./compilerTests/testViewConstraints";
import { ParsePlainDielAst } from "../src/compiler/compiler";
// import { PrintCode } from "../src/util/messages";

const q = `
create event table t1 (
  a int,
  b int
);
create event table t2 (
  c text,
  b int
);

create view v1 as select a from t1 join t2 on t1.b = t2.b where c = 'cat';
create view v2 as select a from t1 join (select max(b) as b from t2) m on m.b = t1.b;
create view v3 as select a from t1 where b in (select b from t2 where c = 'hello');
`;

testGetOriginalRelationsDependedOn();
testDistributionLogc();
// @LUCIE: the following is failing, fix me
// assertLatestSyntax();

testTopologicalSort();

// @LUCIE sorry failing as well.
// assertBasicConstraints();
codeGenBasicSQLTest();
assertBasicOperators();
assertSimpleType();
assertAllStar();
assertMultiplyType();

let ast = ParsePlainDielAst(q);
assertBasicNormalizationOfRelation(ast, q);
assertFunctionParsing(ast, q);

// testMaterializedViewConstraint();
assertCheckViewConstraintTest();
// testMaterialization();