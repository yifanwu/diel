
const groupby_q = `
create view t as
select day, count(*) from flights group by day
constrain a1 NOT NULL;`;

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
select * from (select a1 from t1);
constrain a1 NOT NULL`;


const join_q = `
create table v1 as
select a from t1 join t2 on t1.b = t2.b where c = 'cat'
constrain a1 NOT NULL;`;