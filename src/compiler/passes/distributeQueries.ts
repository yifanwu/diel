import { DielIr, IsRelationTypeDerived, BuiltInColumn } from "../DielIr";
import { OriginalRelation, RelationType, DerivedRelation, DbIdType, RelationIdType, ExprType, ExprColumnAst, Relation, Column, DielDataType, CompositeSelection } from "../../parser/dielAstTypes";
import { ReportDielUserError, LogInternalError, DielInternalErrorType } from "../../util/messages";
import { NodeDependencyAugmented } from "../../runtime/runtimeTypes";
import { SqlOriginalRelation, SqlRelationType, SqlDerivedRelation } from "../../parser/sqlAstTypes";
import { LocalDbId } from "../DielPhysicalExecution";

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
  dbId: DbIdType,
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
  if (IsRelationTypeDerived(node.relationType)) {
    // derived, need to look at the things it needs, then decide who should own this relation
    // logic that decides the relation
    const dependentRecResults = node.dependsOn.map(depRelation => QueryDistributionRecursiveEval(distributions, scope, depRelation));
    const owner = node.relationType === RelationType.Output
      ? LocalDbId
      : scope.selectRelationEvalOwner(new Set(dependentRecResults.map(r => r.dbId)));

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
      dbId: owner,
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
      dbId: node.remoteId,
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


const EventColumns: Column[] = [
  {
    name: BuiltInColumn.TIMESTEP,
    type: DielDataType.Number,
  },
  {
    name: BuiltInColumn.REQUEST_TIMESTEP,
    type: DielDataType.Number,
  }
];

export function GetColumnsFromSelection(selection: CompositeSelection): Column[] {
  const originalColumns = selection[0].relation.derivedColumnSelections;
  if (!originalColumns) {
    return LogInternalError(`query not normalized and cannot be distributed to main`);
  }
  const columns = originalColumns.map(c => {
    let columnName: string;
    if (!c.alias) {
      if (c.expr.exprType === ExprType.Column) {
        columnName = (c.expr as ExprColumnAst).columnName;
      } else {
        ReportDielUserError(`Must specify alias for view columns if they are not colume selections!
        You did not for ${JSON.stringify(c, null, 2)}, with column ${JSON.stringify(c, null, 2)}`);
      }
    } else {
      columnName = c.alias;
    }
    if (!c.expr.dataType) {
      LogInternalError(`Didn't specify the data type!`);
    }
    // FIXME: think about constraints
    return {
      name: columnName,
      type: c.expr.dataType,
    };
  });
  return columns;
}

export function GetSqlOriginalRelationFromDielRelation(relation: Relation, addTimeColumns?: boolean): SqlOriginalRelation {
  switch (relation.relationType) {
    // when we turn an event into a table, the table is dynamic!
    case RelationType.EventTable: {
      const i = relation as OriginalRelation;
      return {
        relationType: SqlRelationType.DynamicTable,
        rName: i.rName,
        columns: addTimeColumns ? i.columns.concat(EventColumns) : i.columns
      };
    }
    case RelationType.ExistingAndImmutable:
    case RelationType.Table: {
      const i = relation as OriginalRelation;
      return {
        relationType: SqlRelationType.StaticTable,
        rName: i.rName,
        columns: i.columns
      };
    }
    // when we turn a view into a table, the table is dynamic!
    case RelationType.DerivedTable:
    case RelationType.View:
    case RelationType.EventView:
      const derived = relation as DerivedRelation;
      const originalColumns = GetColumnsFromSelection(derived.selection.compositeSelections);
      let createSpec: SqlOriginalRelation = {
        relationType: SqlRelationType.DynamicTable,
        rName: relation.rName,
        columns: addTimeColumns ? originalColumns.concat(EventColumns) : originalColumns
      };
      return createSpec;
    default:
      return LogInternalError(`Should all be handled, but ${relation.relationType} was not, for ${relation.rName}`, DielInternalErrorType.UnionTypeNotAllHandled);
  }
}

/**
 * We need the relation, but also additional information about how it should be mapped.
 * @param relation
 */
export function GetSqlDerivedRelationFromDielRelation(relation: Relation): SqlDerivedRelation {
  switch (relation.relationType) {
    case RelationType.EventTable:
    case RelationType.Table:
    case RelationType.ExistingAndImmutable:
      return LogInternalError(`Cannot make table into views`);

    case RelationType.DerivedTable:
      return {
        rName: relation.rName,
        relationType: SqlRelationType.StaticTable,
        selection: (relation as DerivedRelation).selection.compositeSelections
      };
    case RelationType.EventView:
    case RelationType.Output:
    case RelationType.DerivedTable:
    case RelationType.EventView:
    case RelationType.View: {
      return {
        rName: relation.rName,
        relationType: SqlRelationType.View,
        selection: (relation as DerivedRelation).selection.compositeSelections
      };
    }
    default:
      return LogInternalError(`Should all be handled, but ${relation.relationType} was not`, DielInternalErrorType.UnionTypeNotAllHandled);
  }
}

// only create tables for what outputs depend on
// and intersect that too, just just onestep is fine
export function findOutputDep(ir: DielIr) {
  const depTree = ir.dependencies.depTree;
  const outputDep = new Set<string>();
  ir.GetOutputs().map(o => depTree.get(o.rName).dependsOn.map(d => outputDep.add(d)));
  return outputDep;
}