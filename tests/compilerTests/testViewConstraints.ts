import { checkViewConstraint } from "../../src/compiler/passes/generateViewConstraints";
import { getDielAst, getPlainSelectQueryAst } from "../../src/compiler/compiler";
import { GenerateUnitTestErrorLogger } from "../testHelper";
import { TestLogger } from "../testTypes";
let jsonDiff = require("json-diff");


/**
 * Answer Query array order, respectively:
 * not null --> unique --> check constraints
 * See combinedAnswer1 for example.
 */

const notNull1 = `
  create view filtered_view as select a1, a2 from t1 where a1 > 10
  constrain a1 NOT NULL;
`;

const notNullAnswer1 = [
  `
    select *
    from (select a1, a2 from t1 where a1 > 10)
    where a1 IS NULL
    ;
  `
];

const notNull2 = `
  create view filtered_view as select a1, a2 from t1 where a1 > 10
  constrain a1 NOT NULL, a2 NOT NULL;
`;

const notNullAnswer2 = [
  `
    select *
    from (select a1, a2 from t1 where a1 > 10)
    where a1 IS NULL;
  `,
  `
    select *
    from (select a1, a2 from t1 where a1 > 10)
    where a2 IS NULL;
  `
];

const check1 = `
  create view filtered_view as select a1, a2 from t1 where a1 < 10
  constrain CHECK (a1 < 5);
`;

const checkAnswer1 = [
  `
    select *
    from (select a1, a2 from t1 where a1 < 10)
    where NOT (a1 < 5);
  `
];

const check2 = `
  create view filtered_view as select a1, a2 from t1 where a1 < 10
  constrain CHECK (a1 < 5), CHECK (a2 < 10);
`;

const checkAnswer2 = [
  `
    select *
    from (select a1, a2 from t1 where a1 < 10)
    where NOT (a1 < 5);
  `,
  `
    select *
    from (select a1, a2 from t1 where a1 < 10)
    where NOT (a2 < 10);
  `
];

const check3 = `
  create view filtered_view as select a1, a2 from t1 where a1 < 10
  constrain CHECK (a1 < 5 and a2 < 10);
`;

const checkAnswer3 = [
  `
    select *
    from (select a1, a2 from t1 where a1 < 10)
    where NOT (a1 < 5 and a2 < 10);
  `
];

const check4 = `
  create view filtered_view as select a1, a2 from t1 where a1 < 10
  constrain CHECK (a1 < 5 or a2 < 10);
`
;

const checkAnswer4 = [
  `
    select *
    from (select a1, a2 from t1 where a1 < 10)
    where NOT (a1 < 5 or a2 < 10);
  `
];

const unique1 = `
  create view filtered_view as select a1, a2, a3 from t1 where a1 < 10
  constrain UNIQUE (a1, a2);
`;

const uniqueAnswer1 = [
  `
    select a1, a2, COUNT (*)
    from (select a1, a2, a3 from t1 where a1 < 10)
    GROUP BY a1, a2 HAVING COUNT(*) > 1;
  `
];

const unique2 = `
  create view filtered_view as select a1, a2, a3 from t1 where a1 < 10
  constrain UNIQUE (a1, a2), UNIQUE (a3);
`;

const uniqueAnswer2 = [
  `
    select a1, a2, COUNT (*)
    from (select a1, a2, a3 from t1 where a1 < 10)
    GROUP BY a1, a2 HAVING COUNT(*) > 1;
  `,
  `
    select a3, COUNT (*)
    from (select a1, a2, a3 from t1 where a1 < 10)
    GROUP BY a3 HAVING COUNT(*) > 1;
  `
];

const combined1 = `
  create view filtered_view as select a1, a2, a3 from t1
  constrain UNIQUE(a1), CHECK (a2 < 5), a3 NOT NULL;
`
;

const combinedAnswer1 = [
  `
    select *
    from (select a1, a2, a3 from t1)
    where a3 IS NULL;
  `,
  `
    select a1, COUNT (*)
    from (select a1, a2, a3 from t1)
    GROUP BY a1 HAVING COUNT(*) > 1;
  `,
  `
    select *
    from (select a1, a2, a3 from t1)
    where NOT (a2 < 5);
  `
];

const tests = [[combined1, combinedAnswer1],
[notNull1, notNullAnswer1], [notNull2, notNullAnswer2],
[check1, checkAnswer1], [check2, checkAnswer2], [check3, checkAnswer3], [check4, checkAnswer4],
[unique1, uniqueAnswer1], [unique2, uniqueAnswer2]];

export function assertCheckViewConstraintTest() {
  const logger = GenerateUnitTestErrorLogger("assertCheckViewConstraintTest");
  for (let test of tests) {
    const query = test[0] as string;
    const answer = test[1] as string[];
    let ast = getDielAst(query);
    let viewqueries = checkViewConstraint(ast);
    let computedQueries = Array.from(viewqueries)[0][1];
    compareAST(computedQueries, answer, logger);
  }
  logger.pass();
}

function compareAST(computedQueries: string[][], answerQueries: string[], logger: TestLogger) {
  if (answerQueries.length !== computedQueries.length) {
    logger.error("Array length different.");
    return;
  }
  for (let i in computedQueries) {
    let q = computedQueries[i][0];
    let a = answerQueries[i];

    let ast1 = getPlainSelectQueryAst(q);
    let ast2 = getPlainSelectQueryAst(a);

    let pretty1 = JSON.stringify(ast1, null, 2);
    let pretty2 = JSON.stringify(ast2, null, 2);
    let diff = jsonDiff.diff(pretty1, pretty2);

    if (diff !== undefined) {
      logger.error(`${pretty1} is not the same as ${pretty2}`);
    }
  }
}
