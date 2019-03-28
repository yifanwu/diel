import { RelationConstraints, DerivedRelation, Relation, RelationType, DielAst, OriginalRelation, Command, ProgramsIr, BuiltInUdfTypes, DeleteClause, AstType, InsertionClause, RelationSelection } from "../../parser/dielAstTypes";
import { DependencyTree, getTopologicalOrder } from "./passesHelper";
import { RelationIdType } from "../DielPhysicalExecution";
import { GetDependenciesFromViewList, getOriginalRelationsDependedOn } from "./dependnecy";
import { GetAllDerivedViews } from "../DielIr";
import { getEventTableFromDerived} from "./distributeQueries";
import { DielIr } from "../../lib";
import { NormalizeColumnSelection } from "./normalizeColumnSelection";
import { ConstraintClauseContext } from "../../parser/grammar/DIELParser";
import { ExprColumnAst } from "../../parser/exprAstTypes";

export function TransformAstForMaterialization(ast: DielAst) {
  const views = GetAllDerivedViews(ast);
  // console.log("\nderived views\n", views);

  const deps = GetDependenciesFromViewList(views);
  console.log("\ndependency\n", deps);

  // get topo order
  const topoOrder = getTopologicalOrder(deps);
  console.log("\ntopological order\n", topoOrder);

  function getRelationDef(rName: string) {
    return views.find(v => v.name === rName);
  }
  const toMaterialize = getRelationsToMateralize(deps, getRelationDef);
  console.log("\nto materialize\n", toMaterialize);
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

  // console.log("AST!\n", ast);

  // Materialize by topological order
  let view: DerivedRelation;
  topoOrder.forEach(relation => {
    if (toMaterialize.indexOf(relation) !== -1) {
      view = getRelationDef(relation);
      changeASTMaterialize(view, ast, ir,
              getOriginalRelationsDependedOn(view, deps, originalRelations),
              deps.get(view.name).isDependedBy,
              numTables);
      numTables += 1;
    }
  });
}

/**
 * Change the derived view ast into program ast in place
 */
function changeASTMaterialize(view: DerivedRelation,
  ast: DielAst, ir: DielIr, originalTables: Set<string>,
  dependents: string[],
  numTables: number) {
  // console.log(view);

  // 1. make a view into a table
  let table = getEventTableFromDerived(view);
  table.relationType = RelationType.Table;

  // wouldn't view constraints be lost???
  table.constraints = {
    relationNotNull: false,
    relationHasOneRow: false,
    primaryKey: [],
    notNull: [],
    uniques: [],
    exprChecks: [],
    foreignKeys: [],
  } as RelationConstraints;
  table.copyFrom = undefined;


  console.log("\ntable!!!\n", table);

  // 2. make a program ast
  console.log("\noriginal Table!\n", originalTables);

  // 2-0. optimize getting original tables by changning data structure???

  // 2-1. create insert,delete ast
  let deleteCommand = makeDeleteCommand(view);
  let insertCommand = makeInsertCommand(view);
  let program = [deleteCommand, insertCommand] as Command[];

  // 3. push into programs. (this is supposed to preserve topo order)
  let existingProgram: Command[];
  originalTables.forEach(tname => {
    // 3-1. if the tname already exists in the map, append the program
    if (ast.programs.has(tname)) {
      existingProgram = ast.programs.get(tname);
      existingProgram.push(deleteCommand, insertCommand);
      ast.programs.set(tname, existingProgram); // replace
    } else {
      ast.programs.set(tname, program);
    }
  });


  // 4. build the final ast. The order of relations sometimes changes
  // since table -> view -> output order.
  let relationIndex = ast.relations.indexOf(view);
  ast.relations.splice(relationIndex, 1);
  ast.relations.splice(numTables, 0, table);

  // 5. delete derived column selection of the depended outputs and views!
  deleteDependentsDerivedColumnSelection(ast, view.name, dependents, ir);

  console.log("\nFINAL!!!\n", ast);
}

/**
 * Delete Derived Column Selection in the Dependent view or output ast,
 * since they changed into tables
 */
function deleteDependentsDerivedColumnSelection(ast: DielAst, vname: string, dependents: string[], ir: DielIr) {
  let dependent: DerivedRelation;
  // 1. iterate through the dependent that this view is depended by
  dependents.forEach(dname => {
    // dependents have to be derived relation
    dependent = ir.GetRelationDefinition(dname) as DerivedRelation;
    dependent.selection.compositeSelections.forEach(sel => {
      // 2. delete derived column selection
      if (sel.relation.derivedColumnSelections) {
        sel.relation.derivedColumnSelections.forEach((colsel, index) => {
          let expr = colsel.expr as ExprColumnAst;
          if (expr.relationName === vname) {
            sel.relation.derivedColumnSelections.splice(index, 1);
          }
        });
        // 3. remove the json entry completely
        if (sel.relation.derivedColumnSelections.length <= 0) {
          delete sel.relation["derivedColumnSelections"];
        }
      }
    });
  });
}

/**
 * Create AST for DeleteClause
 * e.g) delete from v2;
 * @param view
 */
function makeDeleteCommand(view: DerivedRelation): Command {
  let deleteClause: DeleteClause;
  deleteClause = {
    astType: AstType.Delete,
    relationName: view.name,
    predicate: null
  };
  return deleteClause;
}

/**
 * Create AST for InsertClause
 * e.g) insert into v2 select a + 1 as aPrime from v1;
 * @param view
 */
function makeInsertCommand(view: DerivedRelation): Command {
  let insertClause: InsertionClause;
  insertClause = {
    astType: AstType.Insert,
    relation: view.name,
    columns: [], // what is this for??
    selection: {
      astType: AstType.RelationSelection,
      compositeSelections: view.selection.compositeSelections
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
function getRelationsToMateralize(
  depTree: DependencyTree,
  getRelationDef: (rName: RelationIdType) => Relation
): string[] {
  // originalRelations: OriginalRelation[]; -> t1
  // views: DerivedRelation[]; -> v1 & o1 & o2 will be
  // differentiate views and outputs by relationType field
  // programs: ProgramsIr; -> trigger to update the table will be
  // dependecy helpers
  // generateDependenciesByName

  // const materializationInfo: Map<RelationIdType, Set<RelationIdType>> = new Map();
  // // visit the depTree from Ir, then visit each node;
  // function findMaterializationKeyorSet(rName: string) {
  //   if (!materializationInfo.has(rName)) {
  //     materializationInfo.set(rName, new Set());
  //   }
  //   return materializationInfo.get(rName);
  // }
  let toMAterialize: RelationIdType[] = [];
  depTree.forEach((nodeDep, relationName) => {
    // look up current relationName
    const rDef = getRelationDef(relationName);
    // if the node is a view
    if (rDef && ((rDef.relationType === RelationType.EventView)
     || (rDef.relationType === RelationType.View)
    //  || (rDef.relationType === RelationType.Output)
     )) {
       // and if the view is dependent on by at least two views/outputs, mark it as to materialize
       if (nodeDep.isDependedBy.length > 1) {
        toMAterialize.push(relationName);
        // const dependentInputs = findMaterializationKeyorSet(rDef.name);
        // // check for its dependencies
        // nodeDep.dependsOn.map(dName => {
        //   if ((getRelationDef(dName).relationType === RelationType.EventTable)
        //     || (getRelationDef(dName).relationType === RelationType.Table)) {
        //       dependentInputs.add(dName);
        //     }
        // });
       }
     }
  });
  return toMAterialize;
}