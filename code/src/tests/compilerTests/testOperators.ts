const logicalComposition = `
create view vComp as SELECT a, b from t where (a > 2 and b >2) or (a < 1 and b < 1);`;

const comparison = `
create view v1 as
  select day
  from xBrushItx
  WHERE chart = 'day'
  and day <= high and day >=low;`;

const groupby = `
create view t as select day as x, count(*) as y
from flights
group by day;`;

const orderby = `
create view t2 as select day, delay, carrier from flights order by day, carrier ASC;`;

const combined = `
create view t3 as select day as x, count(*) as y
from flights
group by day order by x ASC;`;

const limit = `
create view t4 as select day from flights limit 1;`;

const countNoInput = `
create view t6 as select count() from testTable;`;

const limitComplex = `
create view t5 as select day from flights
limit (
  select count()
  from testTable
  );`;

const countStar = `
create view t7 as select count(*) from testTable;`;

const countSpecific = `
create view t7 as select count(aColumn) from testTable;`;