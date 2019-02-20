-- this file contains the static parts of DIEL queries

create table allInputs (
  timestep integer primary key,
  inputRelation text not null
);

create trigger afterAllInputs after insert on allInputs
begin
  select tick(new.inputRelation);
end;
