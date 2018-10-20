create program after xBrushItx
BEGIN
  insert into brushDep_SP (itxId, pastItxId)
    select new.itxId, f.itxId
    from itxId_SP f
    where ts = (select max(ts) from itxId_SP)
  ;
  insert into brushState_SP (itxId, chart, componentItx)
    select
      new.itxId,
      s.chart,
      s.componentItx
    from
      brushState_SP s
      join brushDep_SP dep on s.itxId = dep.pastItxId
    where
      dep.itxId = new.itxId
      and s.chart != new.chart;
END;