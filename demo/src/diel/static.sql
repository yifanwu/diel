create table numbers(n integer not null, primary key(n asc));
-- insert generated sequential integers
insert into numbers(n)
select rowid 
from (
  -- build 200 rows using Cartesian product
  select 1
  from (
    select 0 union select 1 union select 2 union select 3 
    union select 4 union select 5 union select 6 
    union select 7 union select 8 union select 9
  ) a, (
    select 0 union select 1 union select 2 union select 3 
    union select 4 union select 5 union select 6 
    union select 7 union select 8 union select 9
  ) b, (
    select 0 union select 2
  )c
) derived;

create table if not exists charts as
select 'day' as chart
union select 'state'
union select 'carrier'
union select 'delays';