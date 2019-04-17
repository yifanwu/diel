import { DielAst, ProgramsIr, DielDataType, RelationType, Column, CompositeSelectionUnit, InsertionClause, OriginalRelation, DerivedRelation, Command, Relation, RelationIdType } from "../../parser/dielAstTypes";
import { LogInternalError, DielInternalErrorType } from "../../util/messages";

export enum SqlRelationType {
  View,
  Table
}

interface SqlRelationBase {
  sqlRelationType: SqlRelationType;
}

export interface SqlOriginalRelation extends SqlRelationBase {
  name: string;
  columns: Column[];
}


export interface SqlDerivedRelation extends SqlRelationBase {
  name: string;
  query: CompositeSelectionUnit[];
}

export type SqlRelation = SqlDerivedRelation | SqlOriginalRelation;

export interface TriggerAst {
  tName: string;
  afterRelationName: string;
  commands: Command[];
}

/**
 * Note
 * - Recycling the programsIr from DIEL AST
 * - Note that the name for programsIr in triggers will not be the original relation but a hashed value
 */
export interface SqlAst {
  relations: SqlRelation[];
  triggers: TriggerAst[];
  commands: Command[];
}

const inputColumns: Column[] = [
  {
    name: "timestep",
    type: DielDataType.Number,
    // constraints: {
    //   primaryKey: true
    // }
  },
  {
    name: "lineage",
    type: DielDataType.Number,
  }
];

export function CreateDerivedSelectionSqlAstFromDielAst(ast: Relation) {
  const v = ast as DerivedRelation;
  return {
    name: v.name,
    sqlRelationType: (v.relationType === RelationType.View) ? SqlRelationType.View : SqlRelationType.Table,
    query: v.selection.compositeSelections
  };
}

// FIXME: this isRemote logic is very ugly...
export function CreateUnitSqlFromUnitDiel(rAst: Relation, isRemote: boolean): SqlRelation {
  switch (rAst.relationType) {
    case RelationType.EventTable: {
      const i = rAst as OriginalRelation;
      return {
        sqlRelationType: SqlRelationType.Table,
        name: i.name,
        columns: isRemote ? i.columns : i.columns.concat(inputColumns)
      };
    }
    // case RelationType.IntermediateEventTable:
    case RelationType.Table: {
      const i = rAst as OriginalRelation;
      return {
        sqlRelationType: SqlRelationType.Table,
        name: i.name,
        columns: i.columns
      };
    }
    case RelationType.Output:
    case RelationType.EventView:
    case RelationType.DerivedTable:
    case RelationType.View: {
      return CreateDerivedSelectionSqlAstFromDielAst(rAst);
    }
    case RelationType.ExistingAndImmutable:
      // pass
      return null;
    default:
      return LogInternalError(`Should all be handled, but ${rAst.relationType} was not`, DielInternalErrorType.UnionTypeNotAllHandled);
  }
}

/**
 * Notes:
 * - staticTables do not need to be created since they already exist
 * @param ast
 */
export function createSqlAstFromDielAst(ast: DielAst, isRemote: boolean): SqlAst {
  const tables: {
    name: RelationIdType,
    columns: Column[]
  }[] = [];
  const views: {
    name: RelationIdType,
    sqlRelationType: SqlRelationType,
    query: CompositeSelectionUnit[]
  }[] = [];
  const relations = ast.relations.map(r => CreateUnitSqlFromUnitDiel(r, isRemote));
  const programsToAddRaw = ast.programs.get("");
  const programsToAdd = programsToAddRaw ? programsToAddRaw : [];

  const triggers: TriggerAst[] = [];
  ast.programs.forEach((v, input) => {
    triggers.push({
      tName: `${input}Trigger`, // inputs are unique since its a map
      afterRelationName: input,
      commands: [...programsToAdd, ...v ],
    });
  });

  const commands = ast.commands;
  return {
    relations,
    triggers,
    commands
  };
}