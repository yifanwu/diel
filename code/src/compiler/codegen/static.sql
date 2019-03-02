-- this file contains the static parts of DIEL queries

create table allInputs (
  timestep integer primary key,
  timestamp DATETIME DEFAULT 0,
  -- timestamp DATETIME DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),
  inputRelation text not null
);

-- special name
insert into allInputs (inputRelation) values ('__init__');

create trigger afterAllInputs after insert on allInputs
begin
  select tick(new.inputRelation);
end;
