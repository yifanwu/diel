import { getTopologicalOrder, getRelationsToMateralize } from "./passesHelper";
import { DeriveOriginalRelationsAViewDependsOn, DeriveDepTreeFromSqlRelations } from "./dependency";
import { GetColumnsFromSelection } from "./distributeQueries";
import { SqlAst, SqlRelationType, SqlDerivedRelation, SqlRelation } from "../../parser/sqlAstTypes";
import { LogInternalError } from "../../util/messages";
import { Command, DeleteClause, AstType, InsertionClause, RelationSelection, DerivedRelation, OriginalRelation, RelationConstraints, ExprType, ExprFunAst, CompositeSelectionUnit, RelationReferenceType, RelationReferenceDirect, ExprAst, ExprColumnAst, ExprParen, SelectionUnit, FunctionType, DielDataType } from "../../parser/dielAstTypes";




/**
 * For now we wil just set the changes on all original tables
 * @param ast
 */
export function TransformAstForMaterializationOP(ast: SqlAst) {
  const dynamic = new Set(ast.relations.filter(r => r.isDynamic).map(r => r.rName));
  const views = ast.relations.filter(r => r.relationType === SqlRelationType.View) as SqlDerivedRelation[];
  const deps = DeriveDepTreeFromSqlRelations(views, dynamic);

  // get topo order
  const topoOrder = getTopologicalOrder(deps);

  function getRelationDef(rName: string) {
    return ast.relations.find(v => v.rName === rName);
  }

  const toMaterialize = getRelationsToMateralize(deps, getRelationDef);

  /// ??? materialize all the views, not just depended by two or more
  // let toMaterialize = new Array<string>();
  // ast.relations.map(r => {
  //   if (r.relationType === SqlRelationType.View) {
  //     toMaterialize.push(r.rName);
  //   }
  // });

  let originalTables: Set<string>;
  // Materialize by topological order
  topoOrder.forEach(relation => {
    if (toMaterialize.indexOf(relation) !== -1) {
      const view = getRelationDef(relation);
      if (!view) {
        LogInternalError(`${relation} was not found!`);
      } else {
        originalTables = DeriveOriginalRelationsAViewDependsOn(deps, view.rName);
        materializeAViewOP(view as SqlDerivedRelation, ast, originalTables);
      }
    }
  });
}

/**
 * Change the derived view ast into program ast in place
 */
function materializeAViewOP(view: SqlDerivedRelation, ast: SqlAst, originalTables: Set<string>) {
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

  // 1-1. translate view constraints into table constraints
  // translateConstraints(view, table);

  // 2. make intializing Insert command
  // (same as the insert command in materializing in view level)
  let insertCommand = makeInsertCommand(view);
  ast.commands.push(insertCommand);

  // 3. make the program.
  originalTables.forEach((tname) => {
    // 3-1. decide if it's update or insert
    let programCommand: Command;
    if (hasAggregate(view)) {
      // udpate
      programCommand = makeUpdateProgramCommand(view);
    } else {
      // insert
      programCommand = makeInsertProgramCommand(view, tname);
    }

    // 4. push into programs. (this is supposed to preserve topo order)
    // 4-1. if the tname already exists in the map, append the program
    const existingTrigger = ast.triggers.find(t => t.afterRelationName === tname);
    if (existingTrigger) {
      existingTrigger.commands.push(programCommand);
    } else {
      ast.triggers.push({
        tName: `${tname}Trigger`,
        afterRelationName: tname,
        commands: [programCommand]
      });
    }
  });

  // 5. build the final ast(change view into table).
  let relationIndex = ast.relations.indexOf(view);
  ast.relations[relationIndex] = table;
}

/**
 * Check if the view has aggregate function or groupby clause.
 * return true if it has those.
 */
function hasAggregate(view: SqlDerivedRelation): boolean {
  let ret: boolean = false;
  // for order by clause, use view level materialization for now
  // ??? what to do with limit clause

  // ??? maybe there is another way to check for these functions.
  // for now, ast says they are "custom" functions.
  const aggregateFunc = ["sum", "min", "max", "avg", "count"];

  for (let selUnit of view.selection)  {
    // 1. check if it has group by clause
    if (selUnit.relation.groupByClause
      && selUnit.relation.groupByClause.selections.length > 0) {
        ret = true;
        return ret;
    }
    // 2. check for built in functions, like count(), sum()
    for (let columnSel of selUnit.relation.derivedColumnSelections) {
      if (columnSel.expr.exprType === ExprType.Func) {
        let expr = columnSel.expr as ExprFunAst;
        let ref = expr.functionReference.toLowerCase();
        if (aggregateFunc.indexOf(ref) !== -1) {
          return true;
        }
      }
    }
  }
  return ret;
}

/**
 * Change the column names to new, if it matches the tablename.
 * Convert nested expressions, too.
 */
function changeColNameToNew(expr: ExprAst, tableName: string) {
  if (!expr) return;
  let typedExpr;
  if (expr.exprType === ExprType.Column) {
    typedExpr = expr as ExprColumnAst;
    if (typedExpr.relationName === tableName) {
      typedExpr.relationName = "new";
    }
  } else if (expr.exprType === ExprType.Func) {
    typedExpr = expr as ExprFunAst;
    typedExpr.args.map((childExpr) => changeColNameToNew(childExpr, tableName));
  } else if (expr.exprType === ExprType.Parenthesis) {
    typedExpr = expr as ExprParen;
    changeColNameToNew(typedExpr.content, tableName);
  } else if (expr.exprType === ExprType.Relation) {
    // ??? this is kinda complicated.
    // might need to change both columns and base relations...
  }
}

/**
 * Convert the view into a program for insert.
 */
function makeInsertProgramCommand(view: SqlDerivedRelation, tableName: string): Command {
  // create a copy, as we will need the original view for creating multiple programs
  let compSel: CompositeSelectionUnit[] = JSON.parse(JSON.stringify(view.selection));

  compSel.map((selUnit) => {
    if (selUnit.relation.baseRelation.relationReferenceType === RelationReferenceType.Direct) {
      const relName = (selUnit.relation.baseRelation as RelationReferenceDirect).relationName;

      if (relName === tableName) {
        // 1-1. delete the base relation
        delete selUnit.relation.baseRelation;
      }

      // 1-2. change every reference to the viewname to "new"
      // all columns should be normalized by now
      // console.log("colsel", selUnit.relation.columnSelections, selUnit.relation.derivedColumnSelections);
      selUnit.relation.columnSelections.map(colSel => changeColNameToNew(colSel.expr, tableName));
      selUnit.relation.derivedColumnSelections.map(colSel => changeColNameToNew(colSel.expr, tableName));

      // 1-3. handle join clauses.
      selUnit.relation.joinClauses.map((joinClause, index) => {
        if (joinClause.predicate) { // check all join's predcate for new
          changeColNameToNew(joinClause.predicate, tableName);
        }
        if (joinClause.relation.relationReferenceType === RelationReferenceType.Direct) {
          if ((joinClause.relation as RelationReferenceDirect).relationName === tableName) {
            // change join clause to where clause
            appendToWhereClause(joinClause.predicate, selUnit.relation);
            selUnit.relation.joinClauses.splice(index, 1); // delete
          }
        } else {
          // ??? what to do when join is from a subquery
        }

      });

    // 1-4. if there is a join, make the first one into a base relation?
    if (selUnit.relation.joinClauses.length > 0 && !selUnit.relation.baseRelation) {
      selUnit.relation.baseRelation = selUnit.relation.joinClauses[0].relation;
      // change that join clause predicate to where clause
      appendToWhereClause(selUnit.relation.joinClauses[0].predicate, selUnit.relation);
      selUnit.relation.joinClauses.splice(0, 1); // delete
    }

    // 1-5. check where clause for new
    changeColNameToNew(selUnit.relation.whereClause, tableName);

    // ??? don't need to check for groupby, orderby since it's handled by update
    } else {
      // ??? what to do when base relation is a subquery
    }
  });

  let insertClause: InsertionClause;
  insertClause = {
    astType: AstType.Insert,
    relation: view.rName,
    columns: [],
    selection: {
      astType: AstType.RelationSelection,
      compositeSelections: compSel
    } as RelationSelection
  };
  return insertClause;
}

/**
 * Takes in join clause and append to existing where clause
 */
function appendToWhereClause(joinExpr: ExprAst, selUnit: SelectionUnit) {
  if (!joinExpr) return;
  if (!selUnit.whereClause) {
    // replace
    selUnit.whereClause = joinExpr;
  } else {
    // append: joinExpr and (existing whereclause)
    // ??? is this okay
    selUnit.whereClause = {
      exprType: ExprType.Func,
      functionType: FunctionType.Logic,
      functionReference: "and",
      dataType: DielDataType.Boolean,
      args: [joinExpr, selUnit.whereClause]
    };
  }
}

function makeUpdateProgramCommand(view: SqlDerivedRelation): Command {
  // Todo
  return null;
}
/**
 * Translate view constraints to table constraints.
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
 * Create AST for InsertClause
 * e.g) insert into v2 select a + 1 as aPrime from v1;
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
