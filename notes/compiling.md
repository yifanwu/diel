# Compiling Notes

## Template and Code Gen

[ ] might need to do a 2 stage one to unpack the templates!


## Error checking

The tradeoff is that there might be contextual information we could throw away and not use.

Doing it all together after basic parsing; this way it might be able to infer some reasons for what is broken:

[ ] typo in relations --- probably going to use a library that checks for edit distance?
[ ] For `compoundOp`, we need to make sure that the relations align

One common issue is the extra "," the error message currently is very opaque and does not point at the ",".

## Current Design Issues

Right now we can load custom DB but not custom TS definition, which does not make sense.

Adding types to DIEL:

Keeping the string interface now since it's easy to implement, but 

## Constraint checking

Even in select queries we can assert whether they are not null etc.

```sql
select a not null, b check (b < 2) from t;
```

nested subqueries must be named.

## Eng notes

Following [example commander](https://github.com/tj/commander.js/blob/master/examples/pizza).

When we create the JS file, it needs to be linked to the DIEL.ts file, which is imported and not edited.  We could alternatively write that to the folder as well... So they don't import from the lib; everything is dumped there already.

__Tick__

For ticking to be customized... we need someway of knowing what is being edited. Want to pass in the input, and the tick will call the outputs?

the tick will be called with the view name.

w.r.t type system, we need a way to know what the types are...
