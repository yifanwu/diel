import { ParsePlainDielAst, ParsePlainSelectQueryAst } from "../../src/compiler/compiler";
import { DielAst, SelectionUnit } from "../../src/parser/dielAstTypes";
import { applyLatestToAst, applyLatestToSelectionUnit } from "../../src/compiler/passes/syntaxSugar";
import { GenerateUnitTestErrorLogger } from "../testHelper";
import { TestLogger } from "../testTypes";
import { SqlStrFromSelectionUnit } from "../../src/compiler/codegen/codeGenSql";

export function assertLatestSyntax() {
  const logger = GenerateUnitTestErrorLogger("assertLatestSyntax");
  for (let test of tests) {
    const qAst = ParsePlainSelectQueryAst(test.query);
    const aAst = ParsePlainSelectQueryAst(test.answer);
    const unit = qAst.compositeSelections[0].relation;
    applyLatestToSelectionUnit(unit);
    compareAST(aAst.compositeSelections[0].relation, unit, logger);
  }
  logger.pass();
}

/**
 */
function compareAST(ast1: SelectionUnit, ast2: SelectionUnit, logger: TestLogger) {
  // Note that relying on JSON stringify is too brittle
  // but we can use our own ast to sql string functions!
  const q1 = SqlStrFromSelectionUnit(ast1).replace(/\s+/g, "");
  const q2 = SqlStrFromSelectionUnit(ast2).replace(/\s+/g, "");
  // let pretty1 = JSON.stringify(ast1, null, 2);
  // let pretty2 = JSON.stringify(ast2, null, 2);

  if (q1 !== q2) {
    logger.error(`\n${q1}\n\nis not the same as\n\n${q2}.`);
  }
}


let tests = [
  // in case of joins, latest should be applied to immediate relations
  {
    query: `
    select a
    from latest t1
    join t2 on t1.b = t2.b;`,
    answer: `
    select a
    from t1
    join t2 on t1.b = t2.b
    where t1.timestep = (select max(timestep) as timestep from t1);`
  },
  // 1. basic
  {
    query: `select arrival from LATEST t1;`,
    answer: `select arrival from t1 where t1.timestep = (select max(timestep) as timestep from t1);`,
  },
  // 2. where clause should be preserved
  {
    query: `select arrival from LATEST t1 where arrival > 10 and arrival < 20;`,
    answer: `select arrival from t1 where arrival > 10 and arrival < 20 and t1.timestep = (select max(timestep) as timestep from t1);`,
  },
  // 3. constraints, group by, order by, limit should also be preservered
  {
    query: `
    select count(*), arrival from LATEST t1
    where arrival > 10
    group by arrival
    order by count DESC
    limit 10
    constrain check (arrival > 10);`,
    answer: `
    select count(*), arrival from t1
    where arrival > 10
    and t1.timestep = (select max(timestep) as timestep from t1)
    group by arrival
    order by count DESC
    limit 10
    constrain check (arrival > 10);`,
  },
  // 5. check multiple latest for explicit join
  {
  query: `
  select a
  from latest t1
  join latest t2 on t1.b = t2.b;`,

  answer: `
  select a
  from t1 join t2 on t1.b = t2.b
  where t1.timestep = (select max(timestep) as timestep from t1)
  and t2.timestep = (select max(timestep) as timestep from t2);`,

  },
  {

  // 6. check multiple latest for implicit join
  query: `
  select a
  from latest t1, latest t2
  where t1.b = t2.b;`,

  answer: `
  select a
  from t1, t2
  where t1.b = t2.b
  and t1.timestep = (select max(timestep) as timestep from t1)
  and t2.timestep = (select max(timestep) as timestep from t2);`,

  },
  {

  // 7. check multiple tables
  query:  `
  select a
  from latest t1, t2
  where t1.b = t2.b ;`,

  answer: `
  select a
  from t1, t2
  where t1.b = t2.b
  and t1.timestep = (select max(timestep) as timestep from t1);`,
  }
];

