import { GenerateUnitTestErrorLogger, LogInfo } from "../../lib/messages";
import { getDielIr, getDielAst } from "../../lib/cli-compiler";
import { DerivedRelation, DielAst } from "../../parser/dielAstTypes";
import { ExprColumnAst } from "../../parser/exprAstTypes";
import {  getSelectionUnitAst, getVanillaSelectionUnitAst } from "../../compiler/compiler";
import { applyLatestToSelectionUnit, applyLatestToAst } from "../../compiler/passes/syntaxSugar";
import {generateSqlFromDielAst, generateSelectionUnit} from "../../../src/compiler/codegen/codeGenSql";
import { ConsoleErrorListener } from "antlr4ts";

import { TransformAstForMaterialization } from "../../compiler/passes/materialization";

export function testMaterialization() {

      const logger = GenerateUnitTestErrorLogger("assertBasicOperators", q3);
      let ast = getDielAst(q3);
      console.log(ast.programs.forEach(value => {
            console.log(value[0]);
      }));
      // let transformedAST = TransformAstForMaterialization(ast);
}


let q1 =
`
create table t1 (a integer);
create table t2 (a integer);
create table t3 (a integer);
create view v1 as select a + 1 as aPrime from t1 where a > 2;
create output o1 as select aPrime from v1 join t2 where aPrime = a;
create output o2 as select aPrime from v1 join t3 where aPrime = a;
`;

let q2 =
`
create table v1 (aPrime integer);
`;

let q3 =
// `
// create program after 
//  begin
//    delete * from v1;
//    insert into v1
//    select a + 1 from t1 where a > 2;
//  end;
// `;



`CREATE PROGRAM AFTER (ueClickEvent, ueUndoEvent)
  BEGIN
    delete from v1;
    INSERT INTO ueAllSelections 
    SELECT * FROM ueCurrentSelection;
  END;`;

// what was the drop thing you wanted me to implement?