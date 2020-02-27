# Instructions for running

```bash
npm install
npm run testEndToEnd
```

Then go to `http://localhost:8080/testEndToEnd/` for the test


A test configuration for postgres might be the following (more examples at diel-db-server-example)
```
const dbConfigs: DbSetupConfig[] = [{
    dbType: DbType.Socket,
    connection: "ws://localhost:8999",
    message: {dbName: "kunal"}
  },
];
```