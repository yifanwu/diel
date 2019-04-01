-- this file contains the static parts of DIEL queries

-- __ are internal tables that developers can access?
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
  lineage integer
);