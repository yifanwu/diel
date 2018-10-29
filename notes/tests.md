# Tests

Generic test: `npm run test`

Testing a specific parsing 

## End to end test

Note that to run the end to end test, the `DIEL.ts` file in `dist` has to be modified because 

The first dummy example: `npm run testFilesSetup testEnd2End`, then run `npm run testFiles2`

The second xFilter `npm run testFilesSetup testXFilterSimple`, then 

To debug the `.db` file locally, simply remove the UDF calls (with `drop trigger allInputsTrigger;`, and may need others depending on code)