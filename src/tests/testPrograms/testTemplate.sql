-- TEST: single
create template t(v)
  select {v} from flights;

-- TEST: double
create template t(v, a)
  select {v}, {a} from flights;

-- TEST: withGroupby
create template chartT(c)
   select {c} as x, count() as y from t1 group by {c};

-- TEST: joinTemplate
create template filteredChartT(v)
  join (
    select high, low from itx WHERE chart = '{v}'
  ) {v}Itx on (t1.{v} <= {v}Itx.high and t1.{v} >= {v}Itx.low)
        or ({v}Itx.low IS NULL);