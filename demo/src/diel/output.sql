create view currentItx as 
  select *
  from xBrushItx b
  where b.itxId in (
    select componentItx
    from brushState_SP 
    where itxId = (select itxId from focusItx)
  );

-- infer that this is
-- single dimention categorical
create crossfilter xFlights on flights;

create chart for xFlights
begin
  -- these are columns followed by whether its ordinal or categorical
  day ordinal;
  state categorical;
  carrier categorical;
  delays ordinal;
end;

-- interactions so that we can match the interactions with the filtering
create interaction for xFlights
begin
  day filtered by chart = 'day' in xBrushItx with predicate day <= high and day >=low;
  state filtered by chart = 'state' in xBrushItx with predicate instr(selection, state);
  carrier filtered by chart = 'carrier' in xBrushItx with predicate instr(selection, state);
  delays filtered by chart = 'delays' in xBrushItx with predicate delays <= high and delays >=low;
end;
