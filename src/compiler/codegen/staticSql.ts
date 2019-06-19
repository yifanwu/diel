// this file contains the static parts of DIEL queries

export const StaticSql = `
create table __scales (
  component text not null,
  dimension integer not null,
  outputName text not null,
  x text,
  y text,
  z text
);

create table allInputs (
  timestep integer primary key,
  -- DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))
  -- timestamp kept track of in the JS code
  timestamp DATETIME not null,
  inputRelation text not null,
  request_timestep integer
);

create table __perf (
  timestep integer,
  kind text,
  ts integer,
  check(kind = 'start' or kind = 'end'),
  primary key(timestep, kind)
);

create view __perfByStep as
  select
    b.timestep, round(e.ts - b.ts, 2) as total
  from
    (select * from __perf where kind = 'begin') b
    join (select * from __perf where kind = 'end') e
    on b.timestep = e.timestep;
`;