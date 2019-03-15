import { Relation, RelationType, DielAst } from "../../parser/dielAstTypes";
import { DependencyTree } from "./passesHelper";
import { RelationIdType } from "../DielPhysicalExecution";
import { GetDependenciesFromViewList } from "./dependnecy";
import { GetAllDerivedViews } from "../DielIr";

export function TransformAstForMaterialization(ast: DielAst) {
  const views = GetAllDerivedViews(ast);
  const deps = GetDependenciesFromViewList(views);
  function getRelationDef(rName: string) {
    return views.find(v => v.name === rName);
  }
  const toMaterialize = getRelationsToMateralized(deps, getRelationDef);
  console.log(`To materialize`, toMaterialize);
  // TODO: Angela
}

/**
 * take in dependency tree and a relation definition lookup function
 *          o1
 *         /
 * t1 -> v1 - o2
 * @param ast
 */
function getRelationsToMateralized(
  depTree: DependencyTree,
  getRelationDef: (rName: RelationIdType) => Relation
) {
  // originalRelations: OriginalRelation[]; -> t1
  // views: DerivedRelation[]; -> v1 & o1 & o2 will be
  // differentiate views and outputs by relationType field
  // programs: ProgramsIr; -> trigger to update the table will be
  // dependecy helpers
  // generateDependenciesByName

  const materializationInfo: Map<RelationIdType, Set<RelationIdType>> = new Map();
  // visit the depTree from Ir, then visit each node;
  function findMaterializationKeyorSet(rName: string) {
    if (!materializationInfo.has(rName)) {
      materializationInfo.set(rName, new Set());
    }
    return materializationInfo.get(rName);
  }
  depTree.forEach((nodeDep, relationName) => {
    // look up current relationName
    const rDef = getRelationDef(relationName);
    // if the node is a view
    if ((rDef.relationType === RelationType.EventView)
     || (rDef.relationType === RelationType.View)
     || (rDef.relationType === RelationType.Output)) {
       // and if the view is dependent on by at least two views/outputs, mark it as to materialize
       if (nodeDep.isDependedBy.length > 1) {
        const dependentInputs = findMaterializationKeyorSet(rDef.name);
        // check for its dependencies
        nodeDep.dependsOn.map(dName => {
          if ((getRelationDef(dName).relationType === RelationType.EventTable)
            || (getRelationDef(dName).relationType === RelationType.Table)) {
              dependentInputs.add(dName);
            }
        });
       }
     }
  });
  return materializationInfo;
}