// TODO: create different types of errors and make sure that they are found properly.

// this one should complain that b is not defined
const errCase1 = `
create view v as
  select b, a*2 as newA
  from (select a from t where a > 5);`;