import { Column, RelationConstraints, CompositeSelectionUnit, Command } from "./dielAstTypes";

// this is actually still not just SQL
// since we differentiate static and dynamic
// this is more an overloaded lable for the event processing system than the actual SQL logic itself.
export enum SqlRelationType {
  View = "View",
  StaticTable = "StaticTable",
  DynamicTable = "DynamicTable"
}

interface SqlRelationBase {
  rName: string;
  relationType: SqlRelationType;
}

export interface SqlOriginalRelation extends SqlRelationBase {
  columns: Column[];
  constraints?: RelationConstraints;
}


export interface SqlDerivedRelation extends SqlRelationBase {
  selection: CompositeSelectionUnit[];
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

export function CreateEmptySqlAst(): SqlAst {
  return {
    // originalRelations: [],
    relations: [],
    // views: [],
    // inserts: [],
    commands: [],
    // drops: []
    triggers: [],
  };
}