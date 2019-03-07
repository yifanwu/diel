# DIEL V0 Source Code

## Setting up

`cd code`
`npm install`
`npm run lang`

Then you should be able to run `npm run test` with all the tests passing!

The run time version/notebook is at `npm run start`.

Note: you might need some additional installations such as Node.js.

## Running with a local database engine

Go to `../server` (on the same level as the current directory), and follow the instructions of the readme.

If you run into problems with configuration and want to bypass, simple to to `/src/notebook/setup.ts` and comment out the `workerDbPaths` and `socketConnection` etc. Currently working on making the sytem more robust to configuration errors (and not crash)