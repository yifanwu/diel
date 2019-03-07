# DIEL Example Server

This is basically a thin wrapper layer around a database instance (works the same as a WebWorker, but much larger).

You should go to `/simple-data`, read the readme and put the files in the right place, then do

```bash
npm install
npm run start
```

## Choosing better-sqlite3

They are fast, and support user-defined aggregate function: `.aggregate(name, options)`.