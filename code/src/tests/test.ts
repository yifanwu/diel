import { assertSimpleType, assertMultiplyType } from "./compilerTests/assertTypes";
// import { testTopologicalSort } from "./unitTest";
import { assertBasicNormalizationOfRelation } from "./compilerTests/assertNormalization";
import { assertBasicOperators } from "./parserTests/basicOperatorsTest";
import { codeGenBasicSQLTest } from "./codeGenTests/sqlTest";
import { assertAllStar } from "./compilerTests/testStarExpantion";
import { assertBasicConstraints } from "./parserTests/constraintsTest";
import { getDielIr } from "../lib/cli-compiler";
import { assertFunctionParsing } from "./parserTests/functionTest";

// TODO: refactor tests to share more compiling and save some time...

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


assertBasicConstraints();
codeGenBasicSQLTest();
assertBasicOperators();
assertSimpleType();
assertAllStar();
assertMultiplyType();

const ir = getDielIr(q);
assertBasicNormalizationOfRelation(ir, q);
assertFunctionParsing(ir, q);

// testTopologicalSort();
