import { getDielIr, getDielAst } from "../../src/compiler/compiler";
import { DielAst } from "../../src/parser/dielAstTypes";
import { TransformAstForMaterialization } from "../../src/compiler/passes/materialization";
import { GenerateUnitTestErrorLogger } from "../testHelper";
import { TestLogger } from "../testTypes";

export function testMaterializationOpLevel() {
  const logger = GenerateUnitTestErrorLogger("testMaterializationOpLevel");
  let ir = getDielIr(q1);
  console.log(ir);
  let ir2 = getDielIr(a1);
  console.log(ir2);
}

let q1 =
`
create event table t1 (a integer);

create view v1 as select sum(a) as sumA, count(a) as countA from t1;

create output o1 as select countA from v1;
create output o2 as select sumA from v1;
`;

let a1 =
`
create event table t1 (a integer);

create table v1 (sumA integer, countA integer);
insert into v1 select sum(a), count(a) from t1;

create program after (t1)
	begin
    update v1 set
      sumVal = (select sumVal + new.a),
      countVal = (select countVal + 1)
      ;
  end;

  create output o1 as select countA from v1;
  create output o2 as select sumA from v1;
`;
