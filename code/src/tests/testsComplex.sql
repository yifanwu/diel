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

-- TEST: moreinvolved
CREATE VIEW filteredBrush AS
  SELECT tweet FROM LATEST brushEvent WHERE NOT EXIST (
    SELECT tweet FROM tweetEvent WHERE timestep > (
      SELECT timestep
      FROM brushEvent
      WHERE mouseEvent='down'
      ORDER BY timestep ASC
      LIMIT 1
    )
  );
