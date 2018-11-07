// must return all the possible types that the intermediate nodes can return
// for now it's just strings; can add to later

export enum DataType {
  String = "String",
  Number = "Number",
  Boolean = "Boolean",
  // this needs to be inferred in the next stage
  TBD = "TBD"
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

export interface ColumnSelection {
  name: string;
  relationName?: string;
}

export interface Column extends ColumnSelection {
  type: DataType;
  constraints?: ColumnConstraints;
}

export interface ColumnConstraints {
  // single column specs
  notNull: boolean;
  unique: boolean;
  key: boolean;
}

// used for inputs and tables
export interface RelationIr {
  name: string;
  columns: Column[];
  // used to see if we generated input from the ts side.
  // used by table statements to figure out if it is dynamic
  isDynamic: boolean;
  // used for sql that specified
  query?: string;
  constraints?: string[];
}

export interface ViewConstraintsIr {
  isNullable: boolean;
  isSingle: boolean;
}

// used for views and outputs
export interface DerivedRelationIr extends SelectQueryIr, ViewConstraintsIr {
  name: string;
  isPublic?: boolean;
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

// this extends columnSection
export interface ExprIr {
  name?: string;
  relationName?: string;
  type: DataType;
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
  relations: RelationReference[];
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

export interface RelationReference {
  // it's either a reference to something defined
  // or a new thing
  // and it can be recursive?? how; hmmm.
  // it's either a static one, or a dynamic one
  // if it's a dynamic one, it has better be defined... so here we do some DFS stuff?
  // isNested: boolean;
  name: string;
  columns: Column[];
}

export interface CrossFilterChartIr {
  chartName: string;
  predicate: JoinClauseIr;
  definition: SelectQueryIr;
}

export interface JoinClauseIr {
  relation: RelationReference;
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

export type ExpressionValue = DielIr | RelationIr | DerivedRelationIr | Column | SelectQueryIr | SelectQueryPartialIr | InsertQueryIr | InsertQueryIr[] | ProgramSpecIr | string | string[] | ProgramsIr | SelectBodyIr | CrossFilterIr | CrossFilterChartIr | TemplateIr | TemplateVariableAssignments | JoinClauseIr | ExprIr | ViewConstraintsIr | ColumnSelection | RelationReference;