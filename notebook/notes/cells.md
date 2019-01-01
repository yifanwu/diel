# DIEL Notebook Architecture: Cell Types

This spec outlines the implementation plan (for the Jan 15th demo)

## Summary Cells

## Query Cells

Each cell contains a query, which generates a set of static queries, and the queries are bound to the nodes.

* take in the fully parsed AST
* transform into other ASTs
* call the DIEL utility function to convert to SQL

It will be an augmented AST --- one where we record the user's new lines (for formatting), add queries to the nodes that are hoverable.

There will be the following kinds of nodes right now

* columns in the individual `selections` (if they are separated by a union, then they are separate)
* the `where` will show a sanky diagram of how much is filtered
* joins will be visualized by how much they augment the original relation size (this is the most useful I've found so far, but we should check)

### Constraint Cells

TODO

## Visual Cells

Each cell could be augmented with a selection, which will create the event tables, which can be joined with the tables post-hoc to emulate interactions.

We can fold this into the query synthesis process since interactions is all SQL.

### Rule Cells

Experimental idea: to occomodate custom visualization needs. E.g., connect the lines when they are close, and do not connect the lines when they are far away --- this is common in timeseries when there can be a cluster of samples collected.

## UDF Cells

### Rendering UDF

The function takes in a table (array of objects).

### Compute UDF

Can look into connecting up to Python, but for now JS functions that are either a map, or a reduce (exactly SQLite syntax).