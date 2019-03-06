# DIEL Example Server

This is basically a thin wrapper layer around a database instance (works the same as a WebWorker, but much larger).

## Choosing better-sqlite3

They are fast, and support user-defined aggregate function: `.aggregate(name, options)`.