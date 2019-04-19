# Intermediate Representation of DIEL Programs

_DIEL internals_: you do __not__ need to read this to use the DIEL framework.

This document walk through how we initially take in queries in the logical space (DIEL IR), then compile it down to execution logic against easch individual database instance (SQL IR), as well as a runtime with event logic.

DIEL specifications needs both an event loop and distributed query processing to run.  We discussed the event loop in [another post](./events.md), and we discuss the representation of the program representation for each logical step here.

## Logical Specification

DIEL IR have a few extra relation types.

Since __caching__ is across events, we instrument it in the DIEL IR layer.  It's a query rewrite that adds a layer of indirection to the data, and provides an internal structure for garbage collection, which we are looking into implementing as well.

## Physical Execution

To __distribute__ the query processing to different nodes and make sure that the nodes have their respective data sources in order to evaluate the queries.  DIEL first generates a basic query plan based on the query AST, it then recurses down the plan to decide whether the view needs to be "shipped". A view needs to be shipped if it is part of a query that spans multiple databases. DIEL picks a “leader” database to execute the query based on the simple heuristic of minimizing the amount of data being shipped.

Based on this shipping specification, at set up time, DIEL ships the queries to the databases that needs to execute these queries, and at run time, DIEL ships the data to the relevant databases. Each shipment of data has its corresponding request timestep. Each database waits for its dependencies for the lowest timestep in the queue and once the dependencies are met, evaluates the queries, shares them with DIEL (or downstream databases), and then evaluates the next timestep in the queue.

Once we generate the SQL IR for each node, we then perform __materialized view maintenance__. First, DIEL materializes intermediate views that are used multiple times. Since views are just named queries in SQL, whenever the database evaluates a query that references the views, the view is also evaluated as part of the query. However, this is inefficient if the view is shared by multiple outputs, because the same query is evaluated multiple times even when we know that the results are the same. To fix this problem, the DIEL optimizer rewrites the views to tables and refreshes the values of the tables by running the view query after the dependent event tables change.
Second, DIEL only invokes the rendering function if there is a new dependent event. This can improve performance if the rendering function naively recomputes and populates the DOM elements.
Third, when evaluating async views, DIEL creates a cache based on past results. For every new event, DIEL first hashes the param- eters of the event tables and then looks up the hash in an internal table, request cache, which contains three columns hash, dataId, and viewName. If the hash is present, DIEL inserts the dataId into the corre- sponding event table for the async view. If the hash is not present, DIEL dispatches the events to evaluate the async views and stores the results with the hash once the result has been received. The dataId creates another layer of indirection that saves storage by duplicating “pointers” as opposed to the actual data. These functionalities are implemented via a combination of compile time query rewrites and runtime event handling.
