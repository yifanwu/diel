import { DielIr, isRelationTypeDerived } from "../DielIr";
import { DataType, OriginalRelation, RelationType, RelationSelection, SetOperator, AstType, CompositeSelectionUnit, DerivedRelation, Relation, Column, ColumnConstraints } from "../../parser/dielAstTypes";
import { ExprType, ExprFunAst, FunctionType, ExprValAst, ExprColumnAst } from "../../parser/exprAstTypes";
import { ReportDielUserError, LogInternalError } from "../../lib/messages";
import { DbIdType, RelationIdType } from "../DielPhysicalExecution";
import { NodeDependencyAugmented } from "./passesHelper";
import { ColumnConstraintsContext } from "../../parser/grammar/DIELParser";

export type SingleDistribution = {
  relationName: RelationIdType,
  from: DbIdType,
  to: DbIdType
  // this is the relation that needs this relation being sent
  forRelationName: RelationIdType,
  finalOutputName: RelationIdType
};

type RecursiveEvalResult = {
  relationName: RelationIdType,
  dbId: DbIdType
};

// keeping this functional so we can test it properly, this is why
// this has so many parameters
export function QueryDistributionRecursiveEval(
  distributions: SingleDistribution[],
  scope: {
    augmentedDep: Map<RelationIdType, NodeDependencyAugmented>,
    selectRelationEvalOwner: (dbIds: Set<DbIdType>) => DbIdType,
    outputName: RelationIdType,
  },
  relationId: RelationIdType): RecursiveEvalResult {
  // find where rel lives, need to access metadata, or just have it augmented with the metadata already?
  // base case
  const node = scope.augmentedDep.get(relationId);
  if (!node) {
    LogInternalError(`Relation ${relationId} not found!`);
  }
  const sharedPartialDistributionObj = {
    forRelationName: node.relationName,
    finalOutputName: scope.outputName,
  };
  if (isRelationTypeDerived(node.relationType)) {
    // derived, need to look at the things it needs, then decide who should own this relation
    // logic that decides the relation
    const dependentRecResults = node.dependsOn.map(depRelation => QueryDistributionRecursiveEval(distributions, scope, depRelation));
    const owner = scope.selectRelationEvalOwner(new Set(dependentRecResults.map(r => r.dbId)));
    dependentRecResults.map(result => {
      distributions.push({
        relationName: result.relationName,
        from: result.dbId,
        to: owner,
        ...sharedPartialDistributionObj
      });
    });
    return {
      relationName: node.relationName,
      dbId: owner
    };
  } else {
    distributions.push({
      relationName: node.relationName,
      from: node.remoteId,
      to: node.remoteId,
      ...sharedPartialDistributionObj
    });
    return {
      relationName: node.relationName,
      dbId: node.remoteId
    };
  }
}

/**
 * there might be corner cases where the view is not shipped e.g. here V1 might not be shipped? it is
 *     V2
 *    / \
 *   V1  R
 *  / \
 * I   R
 */
export function getShippingInfoFromDistributedEval() {

}

export function getEventTableFromDerived(relation: DerivedRelation) {
  const originalColumns = relation.selection.compositeSelections[0].relation.derivedColumnSelections;
  if (!originalColumns) {
    throw new Error(`query not normalized and cannot be distributed to main`);
  }
  const columns = originalColumns.map(c => {
    let columnName: string;
    if (!c.alias) {
      if (c.expr.exprType === ExprType.Column) {
        columnName = (c.expr as ExprColumnAst).columnName;
      } else {
        ReportDielUserError(`Must specify alias for view columns if they are not colume selections!
         You did not for ${relation}, with column ${JSON.stringify(c, null, 2)}`);
      }
    } else {
      columnName = c.alias;
    }
    if (!c.expr.dataType) {
      LogInternalError(`Didn't specify the data type in the relation ${relation}!`);
    }
    return {
      name: columnName,
      type: c.expr.dataType,
      constraints: {
        autoincrement: false,
        notNull: false,
        unique: false,
        primaryKey: false
      } as ColumnConstraints,
      defaultValue: null
    } as Column;
  });
  let createSpec: OriginalRelation = {
    relationType: RelationType.EventTable,
    //  === RelationType.EventView ? RelationType.EventTable : RelationType.Table,
    name: relation.name,
    columns
  };
  return createSpec;
}


// only create tables for what outputs depend on
// and intersect that too, just just onestep is fine
export function findOutputDep(ir: DielIr) {
  const depTree = ir.dependencies.depTree;
  const outputDep = new Set<string>();
  ir.GetOutputs().map(o => depTree.get(o.name).dependsOn.map(d => outputDep.add(d)));
  return outputDep;
}