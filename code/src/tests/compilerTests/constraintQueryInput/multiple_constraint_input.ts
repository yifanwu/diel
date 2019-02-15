
const groupby_q = `
create view t as
select day, count(*)
from flights
group by day
having count(*) > 1;`;

const mult_table = `create view v2 as select t2.* from t join t2 on t.a = t2.a
constrain a1 NOT NULL, a2 NOT NULL;`;

const no_view_q = `CREATE TABLE t1 (
  a1 INTEGER PRIMARY KEY,
  a2 INTEGER NOT NULL);
  insert into t1 (a1, a2) values (100, 120);`;
const no_constraint_q = `CREATE TABLE t1 (
    a1 INTEGER PRIMARY KEY,
    a2 INTEGER NOT NULL);
    insert into t1 (a1, a2) values (100, 120);
    create view filtered_view as select a1 from t1 where a > 10;`;

const nested_select_q = `create view filtered_vew as
select * from
(select a1 from t1);`;
