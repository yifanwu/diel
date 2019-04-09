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
  lineage integer,
  hashVal text
);

create table cacheMeta (
  hash text not null,
  dataId integer not null,
  eventTableName text not null
);
`;
