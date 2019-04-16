-- select sum(a), count(a) as s from t1;

create table t1 (a int);

-- materialized table 
create table s (sumVal int, countVal int);
-- initial value
insert into s select sum(a), count(a) as s from t1;
-- update
create trigger t1sum after insert on t1
  begin
    update s set
      sumVal = (select sumVal + new.a),
      countVal = (select countVal + 1);
  end;

insert into t1 values (2), (3), (4);

create table t3 (c text, name text);
insert into t3 values ('cat', 'bob'), ('dog', 'alex'), ('cat', 'sam');

-- 
insert into t3 values ('cat', 'alice')
-- select count(), c from t3 group by c;
create table t3M as select count() as countVal, c from t3 group by c; 
-- (countVal int, c text);

-- insert into t3M ;
create trigger t3tr after insert on t3
  begin
    update t3M SET
      countVal = (select countVal from t3M where c = new.c) + 1
    where c = new.c;
  end;

create table tt1 (a int, b int);
create table tt3 (a int, c int);

select tt1.b, tt3.c from tt1 join tt3 on tt1.a = tt3.a;

insert into tt1 values (1,2), (2, 4);
insert into tt3 values (1,3), (5, 10);

insert into tt3 values (1,6);

create table tt13M as select tt1.b, tt3.c from tt1 join tt3 on tt1.a = tt3.a;
-- (b int, c int);

create trigger t3tr after insert on tt3
  begin
    insert into tt13M
      select
      -- b
      tt1.b,
      -- c =
      new.c 
      from tt1
      where a = new.a;
  end;