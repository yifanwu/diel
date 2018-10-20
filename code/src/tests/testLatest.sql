select low, high from latest itx;

-- TEST: more involved
CREATE VIEW filteredBrush AS
  SELECT tweet FROM LATEST brushEvent WHERE NOT EXIST (
  SELECT tweet FROM tweetEvent WHERE timestep > (
    SELECT timestep
    FROM LATEST brushEvent
    WHERE mouseEvent='down'
  )
