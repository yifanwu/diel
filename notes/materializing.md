# Materialized Views

At the simplest, we can do basic dependency checking; but materialize all of the intermediate views? Seems a bit dumb. Should do the stress test to see how much triggers would delay things --- currently it seems not much

## Basic

Any views that are used more than once will be materialiazed, and it will be deleted and updated in every trigger of inputs.


## Caching

This should also work with the caching layer with asynchronous sources... 

## Plan for more advanced