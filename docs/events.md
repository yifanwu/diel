# Events and Changes in DIEL

In DIEL everything is "static" within a single logical timestep.

## Even Table

`Event Table`s drive the changes that happen on the screen.  For instance, in the [counter example](./index.md#counter-example) we presented, the event table is `clickEvent`, whose changes _drive_ the advance of the logic time.

![slider](https://i.ibb.co/RHk6KQT/slider.png)

Similarly, in the example of a slider, the events that drive changes are the slide interaction, which we define via the following

```sql
CREATE EVENT TABLE slideItx(year int)
```

And the event changes the state of the application by the following

```sql
CREATE OUTPUT distData AS
  SELECT airport, count(*)
    FROM flights
    JOIN LATEST slideItx
      ON year
    GROUP BY airport;
```

When there is a new slide interaction, the following happesn

1. an event handler in the visualization extracts the slider position and uses a DIEL API to insert it into the slideItx table as a new event record (`{year:2000}`). These events may come from user interactions, automated processes in the client that gener- ate events on behalf of the user (e.g., timers), or from DIEL managed async view evaluations.
2. Clock Increment. To help manage concurrency, DIEL ensures a global ordering of events in the visualization. To do so, DIEL maintains a logical “clock” that increments whenever a new event is inserted. DIEL will automatically add the current logical timestep as the timestep attribute to new events. For instance, the new slider event is annotated with the timestep 3.
3. Query Evaluation. DIEL queries are SQL queries with syntactic shortcuts. If the data is in the client, DIEL simply executes the query and passes the result to the visualization for rendering. However if the data is remote (e.g., the flights Table), DIEL automatically sends the necessary data (e.g., the new event record) to the remote database to execute the query, and updates the local output distData table with the result. Notice that the result rows are annotated with both the request timestep (e.g., 3) and the logical timestep when the response arrived (e.g., 4); this provides necessary information to define the developer’s concurrency policy. For instance, responses for other requests (e.g., previous slider events) may arrive out of order, and the DIEL query can select the desired output based on the timesteps.
4. Output Rendering. DIEL evaluates the output views and invokes the visualization’s rendering function with the result. The function should update the UI (e.g., the bar chart). The rendering function can be implemented with any number of existing frameworks, such as Vega-Lite or D3.

## Async View

DIEL ensures that each event is handled atomically, in a single syn- chronous iteration of the event loop associated with a single logical time. To prevent blocking the UI, it is critical that each iteration runs fast, despite that fact that DIEL queries may be running unpredictably on a remote server. DIEL achieves this by dispatching long-running queries to concurrent services (e.g., remote databases or local worker threads). These services can asynchronously process the queries and return the results at any time, appropriately labeled with request and response timestamps to capture the lag in processing. This is captured in the following diagram.

![remote](https://i.ibb.co/zVCQCqq/model3.png)

Asynchronous results however require direct programmer intervention because they might want to reason with what results get rendered at the current timestep.  To address this, we introduce the syntax `async view`, which is evaluated to a relation with logical timesteps that indicate when it was recied and step that tracks what originating timestep it was from.

For instance, the original output relation `disData` is actually expanded to the following, where `distDataEvent` has the DIEL augmented columns `timestep` and `request_timestep` in addition to its original `airport`, and `count`, which the developer can just query as normal data.

```sql
CREATE ASYNC VIEW distDataEvent AS
  SELECT origin, COUNT()
  FROM flights
    JOIN LATEST slideItx ON year
  GROUP BY origin;

CREATE OUTPUT distData AS
  SELECT *
  FROM distDataEvent e
    JOIN LATEST slideItx i ON i.timestep = e.request_timestep;
```
