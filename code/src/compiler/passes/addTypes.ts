import { DielAst } from "../../parser/dielAstTypes";
import { LogInternalError, ReportDielUserError } from "../../lib/messages";
import { Column, ColumnSelection, RelationReference } from "../../parser/sqlAstTypes";


export function applyTypes(ast: DielAst): void {
  // walk through all the select queries in the IR
  // it's really annoying to organize the internal objects as I want to filter them by different attributes --- would be nice to have a relational representation internally haha

  // const query = getCtxSourceCode(ctx);
  // columns.filter(c => c.type === DataType.TBD).map(c => findType(c, selectBody, query, this.context));
}

// we will also get rid of the stars...


    // // set the context
    // this.context = {program : {isGeneral: true}};
    // TODO: check that this is actually an input
    // checkIsInput(input, this.ir);
    // this.context = {program : {isGeneral: false, name: input}};

export function dielIrComplain(reason: string) {
  LogInternalError(reason);
}

// /**
//  * helper function for the compiler visitor to identify types of the sepecified columns
//  * @param c column
//  * @param selectBody selectbodyIr
//  * @param query used for reporting errors
//  */
// export function findType(c: Column , selectBody: SelectBodyIr,
//   query: string, context: DielContext) {
//   let matchedR: RelationReference;
//   // chec for keywords
//   const special = BuiltInColumns.filter(sc => sc.column === c.name)[0];
//   if (special) {
//     return special.type;
//   }
//   const relationsListForDebug = selectBody.relations.map(r => r.alias).join(", ");
//   if (c.relationName) {
//     let mappedRelationName = c.relationName;
//     // see if its new
//     if (c.relationName === "new") {
//       if ((!context) || (!context.program)) {
//         ReportDielUserError(`You can only reference new relations in a program after an input.`);
//       } else if (context.program.isGeneral) {
//         ReportDielUserError(`You cannot refer to the "new" relation in a general program as the relation is not well defined---it can be any of the inputs.`);
//       } else {
//         // continue on with the new relation name
//         mappedRelationName = context.program.name;
//       }
//     }
//     // search for the relationamte
//     matchedR = selectBody.relations.filter(r => r.alias === mappedRelationName)[0];
//     if (!matchedR) {
//       // Fixme: the error message could be much better here...
//       // TODO: we can do some fuzzy edit distance check thing here; I've always found it nice.
//       ReportDielUserError(`Sepcified relation: column ${c.name} was specified to be from ${c.relationName} in query:\n${query}\nbut ${c.relationName} is not found in the source relations:\n${relationsListForDebug}.`);
//     }
//   } else {
//     // else its not from a specific relation and we need to find it...
//     matchedR = selectBody.relations.filter(r => r.columns.filter(cM => cM.name === c.name).length > 0)[0];
//     if (!matchedR) {
//       ReportDielUserError(`Unspecified relation: column ${c.name} was specified in query:\n${query}\nbut we cannot find it in any of the source relations; here is the list we looked through:\n${relationsListForDebug}.`);
//     }
//   }
//   // now we can change the c.type
//   const matchedC = matchedR.columns.filter(cM => c.name === cM.name)[0];
//   if (!matchedC) {
//     // Fixme: the error message could be much better here...
//     ReportDielUserError(`column ${c.name} in ${query} is not found in the source relations: ${relationsListForDebug}.`);
//   }
//   return matchedC.type;
// }


// export function findRelationColumns(relation: string, ir: DielAst): Column[] {
//   // find in inputs, then tables, then views, and outputs
//   const extractFn = (t: DerivedRelationIr | DynamicRelationIr) => ({
//     name: t.name,
//     columns: t.columns
//   });
//   const rs = ir.dynamicTables.concat(ir.inputs).map(extractFn);
//   const staticTables = ir.staticTables.map(extractFn);
//   const derived = ir.views.concat(ir.outputs).map(extractFn);
//   const joined = rs.concat(staticTables).concat(derived);
//   for (let i = 0; i < joined.length; i++) {
//     if (!joined[i]) {
//       console.log("weird");
//     }
//     if (joined[i].name === relation) {
//       return joined[i].columns;
//     }
//   }
//   return [];
// }