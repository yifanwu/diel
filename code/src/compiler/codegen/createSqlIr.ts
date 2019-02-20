import { DielAst, OriginalRelation, ProgramsIr, DataType, OriginalRelationType, DerivedRelationType } from "../../parser/dielAstTypes";
import { Column, CompositeSelectionUnit, InsertionClause, AstType } from "../../parser/sqlAstTypes";

// in this pass, we will create the Ir needed to create the SQL we need


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
 * - Recycling the programsIr from previous AST
 */
export interface SqlIr {
  // tablespec
  tables: RelationSpec[];
  views: RelationQuery[];
  triggers: ProgramsIr[];
  inserts: InsertionClause[];
}

/**
 * Notes:
 * - staticTables do not need to be created since they already exist
 * @param ast
 */
export function createSqlIr(ast: DielAst): SqlIr {
  const inputColumns: Column[] = [
    {
      name: "timestep",
      type: DataType.Number,
      constraints: {
        primaryKey: true
      }
    },
    {
      name: "timestamp",
      type: DataType.TimeStamp,
      constraints: {
        default: "(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))"
      }
    }
  ];
  const tables = ast.originalRelations
    .filter(i => i.relationType !== OriginalRelationType.ExistingAndImmutable)
    .map(i => {
      if (i.relationType === OriginalRelationType.Input) {
        return {
          name: i.name,
          columns: i.columns.concat(inputColumns)
        };
      } else if (i.relationType === OriginalRelationType.Table) {
        return {
          name: i.name,
          columns: i.columns
        };
      }
      throw new Error(`SQL IR creation error`);
    });

    const views = ast.views
    .map(v => ({
      name: v.name,
      sqlRelationType: v.relationType === DerivedRelationType.View ? SqlRelationType.View : SqlRelationType.Table,
      query: v.selection.compositeSelections
    }));

    const programsAll = ast.programs.filter(p => (p.input));
    const programsToAdd = programsAll.length > 0
      ? programsAll[0].queries
      : [];

    const triggers = ast.programs.map(p => {
      const sharedProgram: InsertionClause = {
        astType: AstType.Insert,
        relation: "allInputs",
        columns: ["inputRelation"],
        values: [`'${p.input}'`]
      };
      return {
        input: p.input,
        queries: [sharedProgram, ...programsToAdd, ...p.queries ]
      };
  });

  const inserts = ast.inserts;
  return {
    tables,
    views,
    triggers,
    inserts
  };
}