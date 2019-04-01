import { DielAst, ProgramsIr, DataType, RelationType, Column, CompositeSelectionUnit, InsertionClause, OriginalRelation, DerivedRelation, Command, Relation } from "../../parser/dielAstTypes";
import { RelationIdType } from "../DielPhysicalExecution";
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

/**
 * Note
 * - Recycling the programsIr from DIEL AST
 */
export interface SqlAst {
  // tablespec
  tables: RelationSpec[];
  views: RelationQuery[];
  triggers: ProgramsIr;
  commands: Command[];
}

const inputColumns: Column[] = [
  {
    name: "timestep",
    type: DataType.Number,
    // constraints: {
    //   primaryKey: true
    // }
  },
  {
    name: "lineage",
    type: DataType.Number,
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

    const triggers: ProgramsIr = new Map();
    ast.programs.forEach((v, input) => {
      // clean up: not going to have this logic here anymore because we need atomic stuff
      // if (isMain) {
      //   const sharedProgram: InsertionClause = {
      //     astType: AstType.Insert,
      //     relation: "allInputs",
      //     columns: ["inputRelation"],
      //     values: [`'${input}'`]
      //   };
      //   triggers.set(input, [sharedProgram, ...programsToAdd, ...v ]);
      // }
      triggers.set(input, [...programsToAdd, ...v ]);
  });

  const commands = ast.commands;
  return {
    tables,
    views,
    triggers,
    commands
  };
}