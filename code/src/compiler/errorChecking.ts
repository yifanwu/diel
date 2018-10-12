// this pass should inforce the following constraints:
// - there should only be one program that's generic 
// - all the columns should match the columsn that exists in the actual tables
// - check that the generic program does not reference the relation new
// - also make sure that the number of inserts match the number of selects in a state program