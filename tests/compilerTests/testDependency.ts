import { DerivedRelation, Relation } from "../../src/parser/dielAstTypes";
import { IsSetIdentical } from "../../src/util/dielUtils";
import { ParsePlainDielAst } from "../../src/compiler/compiler";
import { GetOriginalRelations, GetAllDerivedViews } from "../../src/compiler/DielAstGetters";
import { DeriveOriginalRelationsAViewDependsOn, AddDepTree } from "../../src/compiler/passes/dependency";
import { GenerateUnitTestErrorLogger } from "../testHelper";

export function testGetOriginalRelationsDependedOn() {
  const logger = GenerateUnitTestErrorLogger("testGetOriginalRelationsDependedOn", q1);
  let ast = ParsePlainDielAst(q1);
  const views = GetAllDerivedViews(ast);
  const deps = AddDepTree(ast);

  // @LUCIE TODO: make assertions about the dep tree here
  if ((!deps.get("v1")) || deps.get("v1").dependsOn[0] !== "t1") {
    logger.error(`V1 dependency incorrect!`);
  }

  let originalRelations = [] as string[];
  GetOriginalRelations(ast).forEach(function(value: Relation) {
    originalRelations.push(value.rName);
  });

  views.forEach(function(view: DerivedRelation) {
    let dependedTables = DeriveOriginalRelationsAViewDependsOn(deps, view.rName);
    if (!IsSetIdentical(answer.get(view.rName), dependedTables)) {
      logger.error(`Two sets are not the same, with the dependency tree`, [deps, {expected: answer.get(view.rName), got: dependedTables}]);
    }
  });
  logger.pass();
}

let answer = new Map<string, Set<string>>();
answer.set("v1", new Set(["t1"]));
answer.set("v2", new Set(["t1"]));
answer.set("v3", new Set(["t1", "t2"]));
answer.set("v4", new Set(["t1", "t2"]));
answer.set("v5", new Set(["t1", "t2"]));
answer.set("v6", new Set(["t1", "t2"]));


/**
 *
     t1   t2
      | \ /
     v1  v3
       \   \
       v2   v4   t3
         /  \  /
        v6  v5
*/
let q1 =
`
create event table t1 (a integer);
create event table t2 (b integer);
register table t3 (c integer);

create view v1 as select * from t1;
create view v2 as select * from v1;
create view v3 as select * from t1 join t2 on t1.a = t2.b;
create view v4 as select * from v3;
create view v5 as select * from v4, t3;
create output v6 as select * from v4;
`;