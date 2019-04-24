import { ParsePlainDielAst } from "../../src/compiler/compiler";
import { DielAst, UpdateClause } from "../../src/parser/dielAstTypes";
import { TransformAstForMaterialization } from "../../src/compiler/passes/materialization";
import { GenerateUnitTestErrorLogger } from "../testHelper";
import { TestLogger } from "../testTypes";
import { generateUpdate } from "../../src/compiler/codegen/codeGenSql";

export function testUpdateGrammar() {
  const logger = GenerateUnitTestErrorLogger("testUpdateGrammar");
  let ast = ParsePlainDielAst(q1);
  let command = ast.programs.get("t1")[0];
  let sql = generateUpdate(command as UpdateClause);
  console.log(sql);
}


let q1 =
`
create program after (t1)
  begin
    update s set
      sumVal = (select sumVal + new.a),
      countVal = (select countVal + 1)
    ;
  end;
`;

