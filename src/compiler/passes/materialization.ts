import { getTopologicalOrder } from "./passesHelper";
import { DeriveOriginalRelationsAViewDependsOn, DeriveDepTreeFromSqlRelations } from "./dependency";
import { DependencyTree } from "../../runtime/runtimeTypes";
import { GetColumnsFromSelection } from "./distributeQueries";
import { SqlAst, SqlRelationType, SqlDerivedRelation, SqlRelation } from "../../parser/sqlAstTypes";
import { LogInternalError } from "../../util/messages";
import { Command, DeleteClause, AstType, InsertionClause, RelationSelection, RelationNameType } from "../../parser/dielAstTypes";

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