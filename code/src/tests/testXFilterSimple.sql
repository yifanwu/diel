create table t1 as select 1 as a, 2 as b, 3 as c union select 1, 3, 4 union select 2, 3, 4;

create template chartT(c)
   select {c} as x, count() as y from t1 group by {c};

create template filteredChartT(v)
  join (
    select high, low from itx WHERE chart = '{v}'
  ) {v}Itx on (t1.{v} <= {v}Itx.high and t1.{v} >= {v}Itx.low)
        or ({v}Itx.low IS NULL);

create crossfilter simpleFilter on t1
BEGIN
  create xchart cA
    as use template chartT(c='a')
    with predicate use template filteredChartT(v='a');
  create xchart cB
    as use template chartT(c='b')
    with predicate use template filteredChartT(v='b');
  create xchart cC
    as use template chartT(c='c')
    with predicate use template filteredChartT(v='c');
end;

create input itx (
  chart string,
  low number,
  high number
);