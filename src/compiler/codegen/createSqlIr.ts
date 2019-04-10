import { DielAst, ProgramsIr, DielDataType, RelationType, Column, CompositeSelectionUnit, InsertionClause, OriginalRelation, DerivedRelation, Command, Relation, RelationIdType } from "../../parser/dielAstTypes";
import { LogInternalError, DielInternalErrorType } from "../../util/messages";

export interface RelationSpec {
  name: string;
  columns: Column[];
}

export enum SqlRelationType {
  View,
  Table
}

export interface RelationQuery {
  name: string;
  sqlRelationType: SqlRelationType;
  query: CompositeSelectionUnit[];
}

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
  // tablespec
  tables: RelationSpec[];
  views: RelationQuery[];
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
  ast.relations
    .map(iUnionType => {
      switch (iUnionType.relationType) {
        case RelationType.EventTable: {
          const i = iUnionType as OriginalRelation;
          tables.push({
            name: i.name,
            columns: isRemote ? i.columns : i.columns.concat(inputColumns)
          });
          break;
        }
        // case RelationType.IntermediateEventTable:
        case RelationType.Table: {
          const i = iUnionType as OriginalRelation;
          tables.push({
            name: i.name,
            columns: i.columns
          });
          break;
        }
        case RelationType.Output:
        case RelationType.EventView:
        case RelationType.DerivedTable:
        case RelationType.View: {
          const genAst = CreateDerivedSelectionSqlAstFromDielAst(iUnionType);
          views.push(genAst);
          break;
        }
        case RelationType.ExistingAndImmutable:
          // pass
          break;
        default:
          LogInternalError(`Should all be handled, but ${iUnionType.relationType} was not`, DielInternalErrorType.UnionTypeNotAllHandled);
      }
    });
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
    tables,
    views,
    triggers,
    commands
  };
}