/**
 * This function generates two different queries
 * describing the distribution based on column types
 *
 * the results should be generated as ASTs and mapped to strings
 * via the functions in codeGenSql.ts
 */
export function assertSingleColumnNaive() {
  let q = `
  create input t1 (
      a text,
      b int,
  );
  create view scatterT1 as select a, b from t1;
  `;
  // expect: array
  const expectedResult = [
    `select count(), a from t1 group by a;`,
    `select count(), b from t1 group by b;`
  ];
}

/**
 * much harder
 * Need to run basic statistic on the table
 * - store that in some metadata construct and generate ASTs based on that
 */
export function assertSingleColumnUniqueValuesAware() {
  let q = `
  create input tMany (
      a text,
      b int,
  );
  create input tFew (
    a text,
    b int,
  );
  -- TODO
  insert into tMany (a, b) values ();
  insert into tFew (a, b) values ('hello', 1), ('world', 2);
  create view scatterT1 as select a, b from t1;
  `;
  // expect: array
  // FIXME: below is not name adapted
  const expectedTManyResult = [
    `create view t1BucketByB AS
    select INT(b / 100) * 100 as bBucketCoarse, INT(b / 10) * 10 from t1;
   select count(), bBucket from t1BucketByB group by bBucket;
    `,
    `select count(), b from t1 group by b;`
  ];
}