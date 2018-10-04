# Functionalities



* Recognize `input` from `create input`, and create relevant triggers for the streams that connect to the outputs
* Recognize `output` and create streams based on these views

Only support the minimally required subset of SQL statements.

## Outputs

Requirement
* Rewrite to normal SQL and some simple JS
* Separate parts of the program to local SQL engine and others to either ajax calls or web worker SQL
* The SQL query (and JS wrapper) needed to enable remote excutions, and relevant callbacks that would insert into loca tables
* Create wrapper functions for create objects out of view resuls (almost like ORM)

# Scope Notes

Eventually, we will make it fully SQL compliant (or the subset that works with materialized view maintenance) but for now minimal functionality.

## Performance Considerations

* We can copy just the subset of the data needed for the execution of the remote, but for now we will just copy over the whole table and stay agnostic to what part of the table is actually queried.
* Materialized views is currently not speced

## Design decisions

### Library or separate compilation

Pro compile:
- More type support? E.g., DIEL.specificalCall.insert(); Also the DB would already be loaded so there is less asynchronous loading.
- The runtime may be a lot of asynchrony issues.

Pro library:
- Easier dev/demo; one less step developer needs to do
- Easier implementation: don't have to generate JS strings, which might be a mess.

### ANTLER or PEG

Deciding between using ANTLR4 (modeling after Spark SQL's grammar) or Code School's [sqlite-parser](https://github.com/codeschool/sqlite-parser).  The former would grant us more control, whereas the latter yields the results as a JSON file.  For both, we would have to change the parsing logic a little to allow for DIEL particulars.

Let's walk through the functionalities needed to see if we need the more powerful one.  We replace stream with tables, once identified in JSON. However, that's a bit brittle.


## Patterns

* _Insersion_ While DIEL does not allow insertions, you can either load a table that already has the values, or create a static table like follows: `create table t4 as select 1 as a, 10 as b union select 2, 20;`.