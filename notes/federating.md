# Federated Designs

## WebWorkers

This [SO answer](https://stackoverflow.com/questions/13574158/number-of-web-workers-limit) provides discussions on how to architect the threads.

There seem to be benefits when we increase to > 10 webworkers but when it's crazy, e.g., > 60 it's bad?

## Federation Syntax

Take the flights example, the flights would be registered as Webworker, and loaded in with the API provided by the generated Diel.ts.

## Distributed Execution

We are just going to ship all the client data to the server for now. This should be fairly effective and easy to implement.