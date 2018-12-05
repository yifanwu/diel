# DIEL V0 Source Code

## Setting up

`npm install`

Note: you might need some additional installations such as Node.js.

## Get the IR

Follow the code in `src/tests/debugTool/probeTest.ts` --- for now use the `getDielAst` method, but I'm working on adding more features so you can have more semantic information about the query (e.g., types), and potentially runtime information (e.g, table size and how frequently its been ran).

Note that you should follow the way `probeTest.ts` is ran in the npm package (`ts-node --no-cache src/tests/debugTool/probeTest.ts`) --- there is some TypeScript transpilation weirdness. You can either create a new script for yourself, or run the `ts-node` in the command line.