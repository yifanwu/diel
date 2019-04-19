import { DielIr, isRelationTypeDerived } from "../DielIr";
import { OriginalRelation, RelationType, DerivedRelation, DbIdType, RelationIdType, ExprType, ExprColumnAst, ColumnSelection, DielDataType,
JoinAst, FunctionType, AstType, JoinType, SetOperator} from "../../parser/dielAstTypes";
import { ReportDielUserError, LogInternalError } from "../../util/messages";
import {  } from "../DielPhysicalExecution";
import { NodeDependencyAugmented } from "./passesHelper";

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

export function getEventTableCacheName(tableName: string) {
  return `${tableName}Cache`;
}

export function getEventTableCacheReferenceName(tableName: string) {
  return `${tableName}Reference`;
}

interface TypedColumn {
  name: string,
  type: DielDataType
}

function getEventDerivedColumnSelections(
  cacheTableName: string,
  cacheReferenceName: string,
  columns: TypedColumn[]): ColumnSelection[] {

    var cols: ColumnSelection[] = [];
    columns.forEach(function(c) {
        cols.push({
          expr: {
            exprType: ExprType.Column,
            columnName: c.name,
            relationName: cacheReferenceName,
            hasStar: false,
            dataType: c.type,
          }
        })
    });
    // write more compactly?
    cols.push({
      expr: {
        exprType: ExprType.Column,
        columnName: "timestep",
        relationName: cacheReferenceName,
        hasStar: false,
        dataType: DielDataType.Number,
      }
    });
    cols.push({
      expr: {
        exprType: ExprType.Column,
        columnName: "timestamp",
        relationName: cacheReferenceName,
        hasStar: false,
        dataType: DielDataType.TimeStamp,
      }
    });
    cols.push({
      expr: {
        exprType: ExprType.Column,
        columnName: "lineage",
        relationName: cacheReferenceName,
        hasStar: false,
        dataType: DielDataType.Number,
      }
    });
    return cols;

}

function makeCacheJoinClause(
  cacheRelationName: string,
  referenceRelationName: string): JoinAst {
  const dataId = "dataId"
  let returnVal: JoinAst = {
    astType: AstType.Join,
    joinType: JoinType.Inner,
    relation: {
      relationName: cacheRelationName
    },
    predicate: {
      dataType: DielDataType.Boolean,
      exprType: ExprType.Func,
      functionType: FunctionType.Compare,
      functionReference: "=",
      args: [{
          exprType: ExprType.Column,
          relationName: cacheRelationName,
          columnName: dataId, 
          dataType: DielDataType.Number,
          hasStar: false
        }, { 
          exprType: ExprType.Column,
          relationName: referenceRelationName,
          columnName: dataId,
          dataType: DielDataType.Number,
          hasStar: false
        }
      ]
    }
  };
  return returnVal;
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
      },
      defaultValue: null
    };
  });
  let createSpec: OriginalRelation = {
    relationType: RelationType.EventTable,
    //  === RelationType.EventView ? RelationType.EventTable : RelationType.Table,
    name: relation.name,
    columns
  };
  return createSpec;
}

export function getCacheTableFromDerived(relation: DerivedRelation) {
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
        ReportDielUserError(`Must specify alias for view columns if they are not column selections!
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
      },
      defaultValue: null
    };
  });

  let cacheTableDef: OriginalRelation = {
    name: getEventTableCacheName(relation.name),
    relationType: RelationType.Table,
    //  === RelationType.EventView ? RelationType.EventTable : RelationType.Table,
    columns: columns.concat({
      name: "dataId",
      type: DielDataType.Number,
      constraints: {
        autoincrement: false,
        notNull: false,
        unique: false,
        primaryKey: false
      },
      defaultValue: null

    })
  };

  const cacheReferenceDef: OriginalRelation = {
    name: getEventTableCacheReferenceName(relation.name),
    relationType: RelationType.EventTable,
    columns: [{
      name: "dataId",
      type: DielDataType.Number,
    }]
  };

  var derivedColumnSelections = getEventDerivedColumnSelections(
            cacheTableDef.name,
            cacheReferenceDef.name,
            columns
  );
 
  // [x] RYAN TODO
  /**
   * create view fetchDataEvent as
     select
       c.item, c.val, e.timestep, e.timestamp, e.request_timestep
    from fetchDataEventCache c join fetchDataEventPointer e on c.dataId  = e.dataId;
   */

  const eventTableDef: DerivedRelation = {
    name: relation.name,
    selection: {
      compositeSelections: [{
        op: SetOperator.NA,
        relation: {
          derivedColumnSelections: derivedColumnSelections,
          columnSelections: derivedColumnSelections,
          baseRelation: { relationName: cacheReferenceDef.name },
          joinClauses: [
            makeCacheJoinClause(cacheTableDef.name, cacheReferenceDef.name)
          ]
        }
      }],
      astType: AstType.RelationSelection
    },
    relationType: RelationType.EventView,
  };
  return {
    cacheTableDef,
    cacheReferenceDef,
    eventTableDef
  };
}

// only create tables for what outputs depend on
// and intersect that too, just just onestep is fine
export function findOutputDep(ir: DielIr) {
  const depTree = ir.dependencies.depTree;
  const outputDep = new Set<string>();
  ir.GetOutputs().map(o => depTree.get(o.name).dependsOn.map(d => outputDep.add(d)));
  return outputDep;
}