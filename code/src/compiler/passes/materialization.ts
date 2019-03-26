import { DerivedRelation, Relation, RelationType, DielAst } from "../../parser/dielAstTypes";
import { DependencyTree, getTopologicalOrder } from "./passesHelper";
import { RelationIdType } from "../DielPhysicalExecution";
import { GetDependenciesFromViewList } from "./dependnecy";
import { GetAllDerivedViews } from "../DielIr";

export function TransformAstForMaterialization(ast: DielAst) {
  const views = GetAllDerivedViews(ast);
  console.log("\nderived views\n", views);

  const deps = GetDependenciesFromViewList(views);
  console.log("\ndependency\n", deps);

  // get topo order
  const topoOrder = getTopologicalOrder(deps);
  console.log("\ntopological order\n", topoOrder);

  function getRelationDef(rName: string) {
    return views.find(v => v.name === rName);
  }
  const toMaterialize = getRelationsToMateralize(deps, getRelationDef);
  // now we need to figure out what EventTables toMaterialize depends on
  // this needs to recurse down the depTree.
  // order toMaterialize by topoOrder
  console.log(`\nTo materialize\n`, toMaterialize);

  // Materialize by topological order
  topoOrder.forEach(relation => {
    if (toMaterialize.indexOf(relation) !== -1) {
      changeASTMaterialize(getRelationDef(relation));
    }
  });
  // TODO: materialization
  // change the ASTs --> change view to table
  // add programs (look at DielAstTypes for reference)
}

function changeASTMaterialize(view: DerivedRelation) {
  console.log(view.selection.compositeSelections);
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