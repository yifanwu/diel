// must return all the possible types that the intermediate nodes can return
// for now it's just strings; can add to later

export enum DataType {
  String = "String",
  Number = "Number",
  Boolean = "Boolean"
}

export enum ProgramType {
  Udf = "Udf",
  Insert = "Insert"
}

export enum LoggingLevels {
  Verbose = "Verbose",
  Succinct = "Succinct"
}

export interface TransferInfo {
  depViews: string;
  location: string;
}

export interface Column {
  name: string;
  type: DataType;
  // single column specs
  notNull: boolean;
  unique: boolean;
  key: boolean;
}

// used for inputs and tables
export interface RelationIr {
  name: string;
  columns: Column[];
  // used by table statements to figure out if it is dynamic
  isStatic?: boolean;
  // used for sql that specified
  query?: string;
  constraints?: string[];
}

// used for views and outputs
export interface DerivedRelationIr extends SelectQueryIr {
  name: string;
}

export interface InsertQueryIr {
  relation: string;
  query: string;
}

export interface ProgramSpecIr {
  selectPrograms: SelectQueryIr[];
  insertPrograms: InsertQueryIr[];
}

export interface ProgramsIr extends ProgramSpecIr {
  input: string;
}

export interface DielConfig {
  name?: string;
  existingDbPath?: string;
  loggingLevel?: string;
}

export interface ExprIr {
  name?: string;
}

export interface DielIr {
  inputs: RelationIr[];
  tables: RelationIr[];
  outputs: DerivedRelationIr[];
  views: DerivedRelationIr[];
  programs: ProgramsIr[];
  inserts: InsertQueryIr[];
  drops: InsertQueryIr[];
  crossfilters: CrossFilterIr[];
  templates: TemplateIr[];
  config?: DielConfig;
}

export interface SelectBodyIr {
  fromRelation: string;
  joinRelations: string[];
  joinQuery: string;
  whereQuery: string;
  groupByQuery: string;
  orderByQuery: string;
  limitQuery: string;
}

export interface SelectQueryPartialIr {
  columns: Column[];
  selectQuery: string;
  selectBody: SelectBodyIr;
}

export interface SelectQueryIr extends SelectQueryPartialIr {
  query: string;
}

export interface CrossFilterChartIr {
  chartName: string;
  predicate: JoinClauseIr;
  definition: SelectQueryIr;
}

export interface JoinClauseIr {
  relation: string;
  query: string;
}

export interface CrossFilterIr {
  crossfilter: string;
  relation: string;
  charts: CrossFilterChartIr[];
}

export interface TemplateIr {
  templateName: string;
  variables: string[];
  query: string;
}

export interface TemplateVariableAssignments {
  variable: string;
  assignment: string;
}

export type ExpressionValue = DielIr | RelationIr | DerivedRelationIr | Column | SelectQueryIr | SelectQueryPartialIr | InsertQueryIr | InsertQueryIr[] | ProgramSpecIr | string | string[] | ProgramsIr | SelectBodyIr | CrossFilterIr | CrossFilterChartIr | TemplateIr | TemplateVariableAssignments | JoinClauseIr | ExprIr;