#


## filter

```sql
select score, timeTaken from studentPerformance;
-- studentPerformance: pId, score, timeTaken
-- with the following corresponding interaction table
-- studentPerformanceItx: ts, scoreLow, scoreHigh, timeTakenLow, timeTakenHigh
```

```sql
select pId, toArray(traces) from traces group by pId;
-- studentPerformance: pId, score, timeTaken
```

desired output

```sql
select pId, toArray(traces)
from traces√
join studentPerformance p
join (select * from studentPerformanceItx where ts = (select max(ts) from studentPerformanceItx )) i on p.score < i.scoreHigh ...
group by pId
;
-- studentPerformance: pId, score, timeTaken
```


## pivot

### Example 1

```sql
select score, timeTaken from studentPerformance;
-- studentPerformance: pId, score, timeTaken
```

```sql
select priorExpereince from studentInfo;
-- studentInfo: pId, priorExpereince
-- which in reality is rendered as 
select priorExpereince, count() from studentInfo group by priorExpereince;
```

desired output

```sql
-- this has the con of introducing another operator
select priorExpereince, nest(score, timeTaken) from studentPerformance group by priorExpereince;

-- this is a "materialized pivot", which we can do since the data is already available
select score, timeTaken from studentPerformance where priorExpereince = 'none';
select score, timeTaken from studentPerformance where priorExpereince = 'some';
select score, timeTaken from studentPerformance where priorExpereince = 'a lot';
```
