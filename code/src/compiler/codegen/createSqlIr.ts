import { DielAst, ProgramsIr, DataType, OriginalRelationType, DerivedRelationType } from "../../parser/dielAstTypes";
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
 * - Recycling the programsIr from DIEL AST
 */
export interface SqlIr {
  // tablespec
  tables: RelationSpec[];
  views: RelationQuery[];
  triggers: ProgramsIr;
  inserts: InsertionClause[];
}

/**
 * Notes:
 * - staticTables do not need to be created since they already exist
 * @param ast
 */
export function createSqlAstFromDielAst(ast: DielAst, isMain = true): SqlIr {
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
      // } else {
      triggers.set(input, [...programsToAdd, ...v ]);
      // }
  });

  const inserts = ast.inserts;
  return {
    tables,
    views,
    triggers,
    inserts
  };
}