-- this file contains the static parts of DIEL queries

-- __ are internal tables that developers can access?
create table __scales (
  component text not null,
  outputName text not null,
  x text,
  y text
);


create table allInputs (
  timestep integer primary key,
  -- DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))
  -- timestamp kept track of in the JS code
  timestamp DATETIME not null,
  inputRelation text not null,
  lineage integer
);

-- -- special name
-- insert into allInputs (inputRelation) values ('__init__');

-- create trigger afterAllInputs after insert on allInputs
-- begin
--   select tick(new.inputRelation);
-- end;
