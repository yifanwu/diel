# DIEL IR

A relational transducer needs the following ingredients:

* input
* output
* state program

The rest is inside the execution (e.g., caching), which we will not include for now.

To represent the input, we have the input events schema, and their types — I guess the issue is that even for the same event, there might be different inputs. I suppose that’s something the developer should write themselves. — e..g, my diff dimension brushes — or they can write state programs such that they get merged into the same table, and the developer can deal with the table uniformly.

There is also the develoepr facing aspects, as well as the internal layer with SQL.

`diel` will be exposed as a class.

Ways that the IR is different from the AST:
- the selection will only have Expressions, and all Column Expressions
   must have a source table, as well as functions that take in only one column
- there will be no templates
- all the types will be cast

## parsing

Reference grammars:

* [SQLite](https://github.com/antlr/grammars-v4/blob/master/sqlite/SQLite.g4)

### input

syntax: `create input <name> (<column1> <type>, <column2> <type>)`

* generate JS, exposed via `diel.input`

To support distinct itxIds, the diel class keeps track of current itxId and will insert them inside the wrapper fuction for the inputs.

### output

syntax: `create output <name> as <query>`

* be bound with state update functions (we currently support logic for the likes of React) --- exposed via `diel.bind(diel.views.viewX, reactLifeCycleFunc)`.  `diel` will call `reactLifeCycleFunc` when there is a new interaction and pass it the input of `viewX` as specified.

## tables

There are a few types of relations --- one that's defined in diel, ones that are loaded in as a starting point db file (we also support merging multiple together), one that is loaded in webworker, and one that is loaded on remotes.

If the table is defined with WebWorker in front of it, then the tables will be prepared into a different db that's in a webworker

dynamic vs static tables --- dynamic tables are inserted, static tables are views over non input relations (ugh why are there so many types already?)

Decided to unify the constraints and deviate a litlte from original SQL syntax for convenience (for now; easy to change!) ugh but not null is weird 

### state program

syntax: `after input <input name> begin <insert program> end` (can only insert, and cannot insert into other inputs). The execution is in order and will be executed before the views are evaluted.

State programs are specified in terms of inputs --- it's essentially a trigger

* Need to place them into the right triggers and make sure that the bound output calls are evoked after

### Templates

Might need to omit aliasing in templates.

### Cross-filter

Obeservation that cross-filter is actually really simple logic over how to apply different filters.  Maybe we can create some simple algebra for differen SQL clauses. Ask Joe.

## Run Time

Most of the work should already be done

