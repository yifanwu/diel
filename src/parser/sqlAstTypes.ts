import { Column, RelationConstraints, CompositeSelectionUnit, Command, CompositeSelection, HasDefault } from "./dielAstTypes";

export const enum SqlRelationType {
  View = "View",
  Table = "Table",
}

interface SqlRelationBase {
  rName: string;
  relationType: SqlRelationType;
  isDynamic?: HasDefault<boolean>;
}

export interface SqlOriginalRelation extends SqlRelationBase {
  columns: Column[];
  constraints?: RelationConstraints;
}

export interface SqlDerivedRelation extends SqlRelationBase {
  selection: CompositeSelection;
  isMaterialized?: boolean;
  originalRelations?: Set<string>;
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
    relations: [],
    commands: [],
    triggers: [],
  };
}