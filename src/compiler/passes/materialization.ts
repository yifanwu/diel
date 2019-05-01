import { getTopologicalOrder, getRelationsToMateralize } from "./passesHelper";
import { DeriveOriginalRelationsAViewDependsOn, DeriveDepTreeFromSqlRelations } from "./dependency";
import { GetColumnsFromSelection } from "./distributeQueries";
import { SqlAst, SqlRelationType, SqlDerivedRelation, SqlRelation, SqlOriginalRelation } from "../../parser/sqlAstTypes";
import { LogInternalError } from "../../util/messages";
import { Command, DeleteClause, AstType, InsertionClause, RelationSelection, DerivedRelation, OriginalRelation, RelationConstraints } from "../../parser/dielAstTypes";

/**
 * For now we wil just set the changes on all original tables
 * @param ast
 */
export function TransformAstForMaterialization(ast: SqlAst) {
  const dynamic = new Set(ast.relations.filter(r => r.isDynamic).map(r => r.rName));
  const views = ast.relations.filter(r => r.relationType === SqlRelationType.View) as SqlDerivedRelation[];
  const deps = DeriveDepTreeFromSqlRelations(views, dynamic);

  // get topo order
  const topoOrder = getTopologicalOrder(deps);

  function getRelationDef(rName: string) {
    return ast.relations.find(v => v.rName === rName);
  }
  const toMaterialize = getRelationsToMateralize(deps, getRelationDef);

  let originalTables: Set<string>;
  // Materialize by topological order
  topoOrder.forEach(relation => {
    if (toMaterialize.indexOf(relation) !== -1) {
      const view = getRelationDef(relation);
      if (!view) {
        LogInternalError(`${relation} was not found!`);
      } else {
        originalTables = DeriveOriginalRelationsAViewDependsOn(deps, view.rName);
        materializeAView(view as SqlDerivedRelation, ast, originalTables);
      }
    }
  });
}

/**
 * Change the derived view ast into program ast in place
 */
function materializeAView(view: SqlDerivedRelation, ast: SqlAst, originalTables: Set<string>) {
  const columns = GetColumnsFromSelection(view.selection);
  if (!columns) {
    LogInternalError(`Columsn for ${view.selection} undefined`);
    return;
  }
  let table = {
    relationType: SqlRelationType.Table,
    rName: view.rName,
    columns
  };

  // translateConstraints(view, table);

  // 2. make a program ast
  // 2-1. create insert,delete ast
  let deleteCommand = makeDeleteCommand(view.rName);
  let insertCommand = makeInsertCommand(view);

  // 3. push into programs. (this is supposed to preserve topo order)
  originalTables.forEach(rName => {
    // if the tname already exists in the map, append the program
    const existingTrigger = ast.triggers.find(t => t.afterRelationName === rName);
    if (existingTrigger) {
      existingTrigger.commands.push(deleteCommand, insertCommand);
    } else {
      ast.triggers.push({
        tName: `${rName}Trigger`,
        afterRelationName: rName,
        commands: [deleteCommand, insertCommand]
      });
    }
  });

  // 4. build the final ast. The order of relations sometimes changes
  // since table -> view -> output order.
  let relationIndex = ast.relations.indexOf(view);
  ast.relations[relationIndex] = table;
}

/**
 * Translate view constraints to table constraints.
 * @param view
 * @param table
 */
function translateConstraints(view: SqlDerivedRelation, table: SqlOriginalRelation) {
  // if (view.constraints) {
  //   // 1. translate column constraints
  //   table.columns.forEach(c => {
  //     // 1-1. Handle NOT NULL constraint
  //     if (view.constraints.notNull.indexOf(c.cName) !== -1) {
  //       c.constraints.notNull = true;
  //     }
  //     // 1-2. Handle UNIQUE column constraint
  //     view.constraints.uniques.forEach(array => {
  //       if (array.length === 1 && array[0] === c.cName) {
  //         c.constraints.unique = true;
  //       }
  //     });
  //     // 1-3. No need to translate check constraints
  //     // they are directly copied in step 2, at the end.
  //   });
  //   // 2. copy relation constraints
  //   table.constraints = view.constraints;
  // } else {
  //   table.constraints = {
  //     relationNotNull: false,
  //     relationHasOneRow: false,
  //     primaryKey: [],
  //     notNull: [],
  //     uniques: [],
  //     exprChecks: [],
  //     foreignKeys: [],
  //   } as RelationConstraints;
  // }
}


/**
 * Create AST for DeleteClause
 * e.g) delete from v2;
 * @param view
 */
function makeDeleteCommand(viewName: string): Command {
  let deleteClause: DeleteClause;
  deleteClause = {
    astType: AstType.Delete,
    relationName: viewName,
    predicate: undefined
  };
  return deleteClause;
}

/**
 * Create AST for InsertClause
 * e.g) insert into v2 select a + 1 as aPrime from v1;
 * @param view
 */
function makeInsertCommand(view: SqlDerivedRelation): Command {
  let insertClause: InsertionClause;
  insertClause = {
    astType: AstType.Insert,
    relation: view.rName,
    columns: [],
    selection: {
      astType: AstType.RelationSelection,
      compositeSelections: view.selection
    } as RelationSelection
  };
  return insertClause;
}
