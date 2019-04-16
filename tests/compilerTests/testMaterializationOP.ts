import { getDielIr, getDielAst } from "../../src/compiler/compiler";
import { DielAst } from "../../src/parser/dielAstTypes";
import { TransformAstForMaterialization } from "../../src/compiler/passes/materialization";
import { GenerateUnitTestErrorLogger } from "../testHelper";
import { TestLogger } from "../testTypes";

export function testMaterializationOpLevel() {
  const logger = GenerateUnitTestErrorLogger("testMaterializationOpLevel");
  let ir = getDielIr(q1);
  console.log(ir);
}


let q1 =
`
-- select sum(a), count(a) as s from t1;

create table t1 (a int);

-- materialized table 
create table s (sumVal int, countVal int);

-- initial value
insert into s select sum(a), count(a) as s from t1;

-- update
create program after (t1)
  begin
    update s set
      sumVal = (select sumVal + new.a),
      countVal = (select countVal + 1);
  end;

insert into t1 values (2), (3), (4);
`;

