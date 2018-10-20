# Compiling Notes

## Error checking

The tradeoff is that there might be contextual information we could throw away and not use.

Doing it all together after basic parsing; this way it might be able to infer some reasons for what is broken:

[ ] typo in relations --- probably going to use a library that checks for edit distance?
[ ] For `compoundOp`, we need to make sure that the relations align