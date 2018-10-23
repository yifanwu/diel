CREATE TEMPLATE ordinalChart(v)
  select day as x, count(*) as y from flights group by ${v} order by x ASC;

CREATE TEMPLATE ordinalFilter(v)
    join (
      select high, low from xBrushItx WHERE chart = '${v}'
    ) itx on flights.${v} <= itx.high and flights.${v} >= itx.low;

create template categoricalChart(v)
  select day as x, count(*) as y from flights group by ${v} order by y ASC;

CREATE TEMPLATE categoricalFilter(v)
  select *
  from flights
    join (
      select selection from xBrushItx WHERE chart = '${v}'
    ) itx on instr(selection, '${v}');

-- each chart will have outputs: dayChart.filtered, dayChart.unfiltered
CREATE CROSSFILTER xFlights on flights
BEGIN
  create chart dayChart
    as use template ordinalChart(v='day')
    with predicate use template ordinalFilter(v='day');
  create chart stateChart
    as use template categoricalChart(v='state')
    with predicate use template ordinalFilter(v='state');
  -- output carrierChart
  -- output delaysChart
END;