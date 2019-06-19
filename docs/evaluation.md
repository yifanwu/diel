# Evaluation of the DIEL framework

Three approaches:
* run the numberts
* tell Richard's story
* Github sweep


We first evaluate the overhead added by using DIEL, c.
[ ] get wasm working with webpack & webworkers
[ ] evaluate the overhead of DIEL with very simple/small datasets vs running in arrays in vanilla JS
[ ] make the previous small dataset larger and compare against parallelism with webworkers
[ ] compare webworker parallelization perf with crossfilter.js  and see where crossfitler breaks
[ ] show numbers for connecting to local postgres instance

The number of resulting Github repos is not that large.

My hypothesis is that people do not publish it unless its a generalizable tool --- I suspect tha tthe market is probably people using Tableau/Looker, or private adhoc tools. Github has a bias for tool-based repos.

Maybe our better bet is looking at notebooks --- where people already write SQL(or pandas) queries and generate visualizations.

## WebWorker Demo

chart 1 -- filter on t1

chart 2 ---- same filter on t2


table t1 (load t1 into worker)

table t2 (load t2 into worker)
