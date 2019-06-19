# Performance Enhancement Techniques

The workload for DIEL is such that we have a lot of joins, these joins are pretty cheap if materialized immediately, but it seems that SQLite is a bit dumb, so a good way to use DIEL is to create lots of views and DIEL will force materialization (by creating triggers).
