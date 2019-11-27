import { getTopologicalOrder } from "./passesHelper";
import { DeriveOriginalRelationsAViewDependsOn, DeriveDepTreeFromSqlRelations } from "./dependency";
import { DependencyTree } from "../../runtime/runtimeTypes";
import { GetColumnsFromSelection } from "./distributeQueries";
import { SqlAst, SqlRelationType, SqlDerivedRelation, SqlRelation } from "../../parser/sqlAstTypes";
import { LogInternalError } from "../../util/messages";
import { Command, DeleteClause, AstType, InsertionClause, RelationSelection, RelationNameType, DerivedRelation, OriginalRelation, RelationConstraints } from "../../parser/dielAstTypes";
import { DbDriver } from "../../runtime/DbEngine";

/**
 * For now we wil just set the changes on all original tables
 * @param ast
 */
export function TransformAstForMaterialization(ast: SqlAst, dbDriver: DbDriver) {
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
        if (originalTables.size === 0) {
          // this means that this is a static view, in that it just need to be populated once...
          // we then just need to change its reference to a table
          // set in place
          view.relationType = SqlRelationType.Table;
        } else {
          materializeAView(view as SqlDerivedRelation, ast, originalTables, dbDriver);
        }
      }
    }
  });
}

/**
 * Change the derived view ast into program ast in place
 */
function materializeAView(view: SqlDerivedRelation, ast: SqlAst, originalTables: Set<string>, dbDriver: DbDriver) {
  console.log(`Materializing view! ${view.rName}`);
  // @Lucie TODO: if it livesin a postgresql database, just set materizlie to true
  switch (dbDriver) {
    case DbDriver.Postgres: {
      // set materialize to true and generate triggers
      view.isMaterialized = true;
      view.originalRelations = originalTables;
      originalTables.forEach(tName => {
        // check there is a trigger already after that table, calculate its order
        // This is needed for correctly ordering the triggers for postgres
        // only works when there are few triggers on the same table(less than what ascii can support)
        const count = ast.triggers.reduce((n, trigger) => {
          return trigger.afterRelationName === tName ? n + 1 : n;
        }, 0);
          ast.triggers.push({
            tName: `${tName}Trigger_${String.fromCharCode(count + 65)}`,
            afterRelationName: tName,
            commands: [],
            functionName: `refresh_mat_view_${view.rName}`
          });
        }
      );
      break;
    }
    case DbDriver.SQLite: {
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
      originalTables.forEach(tName => {
        // if the tname already exists in the map, append the program
        const existingTrigger = ast.triggers.find(t => t.afterRelationName === tName);
        if (existingTrigger) {
          existingTrigger.commands.push(deleteCommand, insertCommand);
        } else {
          ast.triggers.push({
            tName: `${tName}Trigger`,
            afterRelationName: tName,
            commands: [deleteCommand, insertCommand]
          });
        }
      });

      // 4. build the final ast. The order of relations sometimes changes
      // since table -> view -> output order.
      let relationIndex = ast.relations.indexOf(view);
      ast.relations[relationIndex] = table;
      break;
    }
  }
}

/**
 * Translate view constraints to table constraints.
 * @param view
 * @param table
 */
function translateConstraints(view: DerivedRelation, table: OriginalRelation) {
  if (view.constraints) {
    // 1. translate column constraints
    table.columns.forEach(c => {
      // 1-1. Handle NOT NULL constraint
      if (view.constraints.notNull.indexOf(c.cName) !== -1) {
        c.constraints.notNull = true;
      }
      // 1-2. Handle UNIQUE column constraint
      view.constraints.uniques.forEach(array => {
        if (array.length === 1 && array[0] === c.cName) {
          c.constraints.unique = true;
        }
      });
      // 1-3. No need to translate check constraints
      // they are directly copied in step 2, at the end.
    });
    // 2. copy relation constraints
    table.constraints = view.constraints;
  } else {
    table.constraints = {
      relationNotNull: false,
      relationHasOneRow: false,
      primaryKey: [],
      notNull: [],
      uniques: [],
      exprChecks: [],
      foreignKeys: [],
    } as RelationConstraints;
  }
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

/**
 * take in dependency tree and a relation definition lookup function
 *          o1
 *         /
 * t1 -> v1 - o2
 * @param ast
 */
function getRelationsToMateralize(depTree: DependencyTree, getRelationDef: (rName: RelationNameType) => SqlRelation | undefined ): string[] {
  let toMAterialize: RelationNameType[] = [];
  depTree.forEach((nodeDep, relationName) => {
    const rDef = getRelationDef(relationName);
    if (rDef && (rDef.relationType === SqlRelationType.View)) {
       // and if the view is dependent on by at least two views/outputs, mark it as to materialize
       if (nodeDep.isDependedBy.length > 1) {
        toMAterialize.push(relationName);
       }
     }
  });
  return toMAterialize;
}