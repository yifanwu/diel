# API 

## Compiling DIEL code



## Getting the AST


## Getting Executable and Inspectable AST

Provides an interface that can run and gather run-time information.

It's very similar to compiling DIEL code --- instead of transpiling, it will provide a single object which wraps around a db instance and has an invoke function.

Note for the future: this function can be called a few differnt times, with the assumption that the underlyikng data changes.

The API also provides access to basic viewing options:

* any two selections will be plotted directly against the other
* any three? some show me heuristic --- if one of th relation is very few unique values (e.g., true/false), then do small multiples or layer them.
* all column will have "select <c> from <r> group by <bin>" visualized --- with heuristics of numeric values binned, categorical values ranked for top 10. (note for interface: visualizations can be clipped) --- hm should we show the column before the join or after, we can have a before and after.
* all joins will show how much it joined with the join attribute that it was predicated on.

The API will also offer a visitor pattern such that the corresponding UI elements can be generated, and each over would invoke a function whose result can be used to render.


## AST Composition

Provide a (ranked) list of new queries (or even sets of queries) that can be generated.

With history as a relation, this is not too bad.

### Existing

-> filter: one relation is inserted as a select

-> pivot: ??

### New?

