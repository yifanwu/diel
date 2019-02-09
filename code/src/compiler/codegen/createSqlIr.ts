import { DielAst, OriginalRelation, ProgramsIr, DataType } from "../../parser/dielAstTypes";
import { Column, CompositeSelectionUnit, InsertionClause } from "../../parser/sqlAstTypes";

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
        key: true
      }
    },
    {
      name: "timestamp",
      type: DataType.Number,
    }
  ];
  const tables = ast
    .inputs
    .map(i => ({
      name: i.name,
      columns: i.columns.concat(inputColumns)
    }))
    .concat(ast.originalRelations)
    .map(i => ({
      name: i.name,
      columns: i.columns
    }));
  const views = ast
    .views
    .concat(ast.outputs)
    .map(v => ({
      name: v.name,
      sqlRelationType: SqlRelationType.View,
      query: v.selection.compositeSelections
    }));

  const programsAll = ast.programs.filter(p => (p.input));
  const programsToAdd = programsAll.length > 0
    ? programsAll[0].queries
    : [];

  const triggers = ast.programs.map(p => {
    return {
      input: p.input,
      queries: programsToAdd.concat(p.queries)
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