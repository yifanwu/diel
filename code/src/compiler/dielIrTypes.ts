/**
 * Ways that the IR is different from the AST:
 * - the selection will only have Expressions, and all Column Expressions
 *   must have a source table, as well as functions that take in only one column
 * - there will be no templates
 * - all the types will be cast
 */

// this is the normalized representation...
// i wonder how to compose this with the others
export interface SelectionUnitIr {

}