import { generateViewConstraintCheckQuery } from "../../src/compiler/passes/generateViewConstraints";

const notNullOne = `
  create view filtered_view as select a1, a2 from t1 where a1 > 10
  constrain a1 NOT NULL;
`;
const notNullTwo = `
  create view filtered_view as select a1, a2 from t1 where a1 > 10
  constrain a1 NOT NULL, a2 NOT NULL;
`;

const check1 = `
  create view filtered_view as select a1, a2 from t1 where a1 < 10
  constrain CHECK (a1 < 5);
`;

const check2 = `
  create view filtered_view as select a1, a2 from t1 where a1 < 10
  constrain CHECK (a1 < 5), CHECK (a2 < 10);
`;

const check3 = `
  create view filtered_view as select a1, a2 from t1 where a1 < 10
  constrain CHECK (a1 < 5 and a2 < 10);
`;

const unique1 = `
  create view filtered_view as select a1, a2, a3 from t1 where a1 < 10
  constrain UNIQUE (a1, a2);
`;

const unique2 = `
  create view filtered_view as select a1, a2, a3 from t1 where a1 < 10
  constrain UNIQUE (a1, a2), UNIQUE (a3);
`;

const toTest = [notNullOne, notNullTwo, check1, check2, check3, unique1, unique2];
function assertCheckViewConstraintTest() {
    toTest.forEach(element => {
        // @LUCIE: FIXME: right now it just prints and does not actually assert
        // const logger = GenerateUnitTestErrorLogger("assertCheckViewConstraintTest", element);
        let viewqueries = generateViewConstraintCheckQuery(element);
        viewqueries.forEach(function(values, key) {
            console.log("View: " + key);
            values.forEach(function(ls) {
                console.log("constraint: " + ls[1]);
                console.log(`=============== Query =================`);
                console.log(ls[0]);
                console.log("=======================================");
            });
        });
    });
}

assertCheckViewConstraintTest();
