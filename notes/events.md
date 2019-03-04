# Understanding Events and Reactivity in DIEL

In _DIEL_, everything is stored in table, and changes happen by appending to tables.  However, since _everything_ is a relation, we need to differentiate between state changes that should not update.  This is where talk about the differences between an input and a table.

The logic that glues the raw data to derived data are queries stored in views.  The final view that gets output to the UI is special, so we created the `OUTPUT` abstraction, and we discuss the differences between an `OUTPUT` and a `VIEW` below.

## INPUT vs TABLE

Events are captured as `create input`, whereas tables are captured just as `create table`.

For instance, if we want to have an reactive counter, we would say

```
CREATE INPUT click (delta number);
CREATE OUTPUT currentCount AS
  SELECT sum(delta)
  FROM click;
```

Since `click` is an input, when there is an insertion into click, the bound functions to the views will be triggered. However, if the click is specified as a table, like `CREATE TABLE click (delta number);`, then there is no guanrantee that the UI that depends on `currentCount` will be kept up to date with the changes in `click`.

## OUTPUT vs VIEW

A view is a query over the relations, and an `OUTPUT` is a view as well, however, it's special because it needs to be none-blocking, which is to say that it must be over tables in the main database.

For instance, let's say that our counter also depends on some data that lives in a worker, then the logical expression is the following

```
CREATE VIEW totalWorkerClickEvents AS
  select sum(click.delta) + sum(existingClicks.delta) as count
  from click
  join existingClicks;
```

However, because `existingClicks` lives in a webworker, this view is asynchronous, so it cannot be an `OUTPUT`, and the output is expressed as the following:

```
create output currentClick AS
  select count from totalWorkerClickEvents order by timestep desc limit 1;
```