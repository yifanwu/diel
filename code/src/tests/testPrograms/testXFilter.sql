CREATE TEMPLATE ordinalChart(v)
  select day as x, count(*) as y from flights group by {v} order by x ASC;

CREATE TEMPLATE ordinalFilter(v)
  join (
    select high, low from xBrushItx WHERE chart = '{v}'
  ) {v}Itx on (flights.{v} <= {v}Itx.high and flights.{v} >= {v}Itx.low)
        or ({v}Itx.low IS NULL);

create template categoricalChart(v)
  select day as x, count(*) as y from flights group by {v} order by y ASC;

CREATE TEMPLATE categoricalFilter(v)
  join (
    select selection from xBrushItx WHERE chart = '{v}'
  ) {v}Itx on instr({v}Itx.selection, flights.{v}) or ({v}Itx.selection IS NULL);

-- each chart will have outputs: dayChart.filtered, dayChart.unfiltered
CREATE CROSSFILTER xFlights on flights
BEGIN
  create xchart dayChart
    as use template ordinalChart(v='day')
    with predicate use template ordinalFilter(v='day');
  create xchart delayChart
    as use template ordinalChart(v='delay')
    with predicate use template ordinalFilter(v='delay');
  create xchart stateChart
    as use template categoricalChart(v='state')
    with predicate use template ordinalFilter(v='state');
  create xchart carrierChart
    as use template categoricalChart(v='carrier')
    with predicate use template ordinalFilter(v='carrier');
END;