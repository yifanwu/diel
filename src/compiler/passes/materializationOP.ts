import { CompositeSelection, ExprColumnAst, ColumnSelection, ExprFunAst, RelationConstraints, DerivedRelation, Relation, RelationIdType, RelationType, DielAst, OriginalRelation, Command, ProgramsIr, BuiltInUdfTypes, DeleteClause, AstType, InsertionClause, RelationSelection, ExprType, ExprAst, ExprParen, ExprRelationAst, SelectionUnit, FunctionType, DielDataType } from "../../parser/dielAstTypes";
import { DependencyTree, getTopologicalOrder, getRelationsToMateralize } from "./passesHelper";
import { GetDependenciesFromViewList, getOriginalRelationsDependedOn } from "./dependency";
import { GetAllDerivedViews } from "../DielIr";
import { getEventTableFromDerived} from "./distributeQueries";
import { DielIr } from "../DielIr";
import { NormalizeColumnSelection } from "./normalizeColumnSelection";
import { DataTypeContext } from "../../parser/grammar/DIELParser";

/**
 * Materialization in the operator level
 */
export function TransformAstForMaterializationOP(ast: DielAst) {
  const views = GetAllDerivedViews(ast);
  const deps = GetDependenciesFromViewList(views);

  // get topo order
  const topoOrder = getTopologicalOrder(deps);

  function getRelationDef(rName: string) {
    return views.find(v => v.name === rName);
  }
  const toMaterialize = getRelationsToMateralize(deps, getRelationDef);
  // now we need to figure out what EventTables toMaterialize depends on
  // this needs to recurse down the depTree.
  // order toMaterialize by topoOrder

  // Get normalized Diel IR
  let ir = new DielIr(ast);
  NormalizeColumnSelection(ir);

  // Get a list of original relations for faster lookup for insert clause
  let originalRelations = [] as string[];
  ir.GetOriginalRelations().forEach(value => {
    originalRelations.push(value.name);
  });
  let numTables = originalRelations.length;

  let view: DerivedRelation;
  let originalTables: Set<string>;
  // Materialize by topological order
  topoOrder.forEach(relation => {
    if (toMaterialize.indexOf(relation) !== -1) {
      view = getRelationDef(relation);
      // TODO. optimize getting original tables by changning data structure???
      // currently, it's done by one pass bfs of deptree
      originalTables = getOriginalRelationsDependedOn(view, deps, originalRelations);
      // Materialize the view into table
      changeASTMaterializeOP(view, ast, ir,
              originalTables,
              deps.get(view.name).isDependedBy,
              numTables);
      numTables += 1;
    }
  });
}

/**
 * Change the derived view ast into program ast in place
 */
function changeASTMaterializeOP(view: DerivedRelation,
  ast: DielAst, ir: DielIr, originalTables: Set<string>,
  dependents: string[],
  numTables: number) {

  let relationIndex = ast.relations.indexOf(view);
  // 1. make a view into a table
  let table = getEventTableFromDerived(view);
  table.relationType = RelationType.Table;

  // 1-1. translate view constraints into table constraints
  translateConstraints(view, table);
  table.copyFrom = undefined;

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
    if (ast.programs.has(tname)) {
      let existingProgram = ast.programs.get(tname);
      existingProgram.push(programCommand);
      ast.programs.set(tname, existingProgram);
    } else {
      ast.programs.set(tname, [programCommand]);
    }
  });

  // 5. build the final ast(change view into table).
  // The order of relations sometimes changes
  // since table -> view -> output order.
  ast.relations.splice(relationIndex, 1);
  ast.relations.splice(numTables, 0, table);
}

/**
 * Check if the view has aggregate function or groupby clause.
 * return true if it has those.
 */
function hasAggregate(view: DerivedRelation): boolean {
  let ret: boolean = false;
  // LATER. for order by clause, use view level materialization for now
  // THINK about limit clause?

  // ??? maybe there is another way to check for these functions?
  // for now, ast says they are "custom" functions.
  const aggregateFunc = ["sum", "min", "max", "avg", "count"];

  for (let selUnit of view.selection.compositeSelections)  {
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
function makeInsertProgramCommand(view: DerivedRelation, tableName: string): Command {
  // create a copy, as we will need the original view for creating multiple programs
  let compSel = JSON.parse(JSON.stringify(view.selection.compositeSelections)) as CompositeSelection;

  compSel.map((selUnit) => {
    let relName = selUnit.relation.baseRelation.relationName;
    if (relName === tableName) {
      // 1-1. ??? delete the base relation
      delete selUnit.relation.baseRelation;
    }
    // 1-2. change every reference to the viewname to "new"
    // ??? if there is no table name for a column name.. how do you know the base relation?
    selUnit.relation.columnSelections.map(colSel => changeColNameToNew(colSel.expr, tableName));
    selUnit.relation.derivedColumnSelections.map(colSel => changeColNameToNew(colSel.expr, tableName));

    // 1-3. handle join clauses.
    selUnit.relation.joinClauses.map((joinClause, index) => {
      if (joinClause.predicate) { // check all join's predcate for new
        changeColNameToNew(joinClause.predicate, tableName);
      }
      if (joinClause.relation.relationName === tableName) {
        // change join clause to where clause
        appendToWhereClause(joinClause.predicate, selUnit.relation);
        selUnit.relation.joinClauses.splice(index, 1); // delete
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
  });

  let insertClause: InsertionClause;
  insertClause = {
    astType: AstType.Insert,
    relation: view.name,
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

function makeUpdateProgramCommand(view: DerivedRelation): Command {
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
      if (view.constraints.notNull.indexOf(c.name) !== -1) {
        c.constraints.notNull = true;
      }
      // 1-2. Handle UNIQUE column constraint
      view.constraints.uniques.forEach(array => {
        if (array.length === 1 && array[0] === c.name) {
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
function makeInsertCommand(view: DerivedRelation): Command {
  let insertClause: InsertionClause;
  insertClause = {
    astType: AstType.Insert,
    relation: view.name,
    columns: [],
    selection: {
      astType: AstType.RelationSelection,
      compositeSelections: view.selection.compositeSelections
    } as RelationSelection
  };
  return insertClause;
}
