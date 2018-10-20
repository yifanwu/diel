-- TEST: joins
create view focusItxRaw as 
  select
    case when n.ts is null or max(b.ts) > max(n.ts)
      then max(b.itxId)
      else n.xFilterItxId
    end + coalesce(delta.val, 0) as itxId
  from lastBrush b
  left outer join lastNavigate n
  left outer join (
    select sum(val) as val
    from deltaItx
  ) as delta;