import { getDielIr, getDielAst } from "../../src/compiler/compiler";
import { DielAst } from "../../src/parser/dielAstTypes";
import { TransformAstForMaterialization } from "../../src/compiler/passes/materialization";
import { GenerateUnitTestErrorLogger } from "../testHelper";
import { TestLogger } from "../testTypes";

export function testUpdateGrammar() {
  const logger = GenerateUnitTestErrorLogger("testUpdateGrammar");
  let ir = getDielIr(q1);
  console.log(ir.ast);
}


let q1 =
`
create program after (t1)
  begin
    update s set
      sumVal = (select sumVal + new.a)
    ;
  end;
`;

