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

export interface TransferInfo {
  depViews: string;
  location: string;
}

export interface Column {
  name: string;
  type: DataType;
}

// used for inputs and tables
export interface RelationIr {
  name: string;
  columns: Column[];
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

export interface DielIr {
  inputs: RelationIr[];
  tables: RelationIr[];
  outputs: DerivedRelationIr[];
  views: DerivedRelationIr[];
  programs: ProgramsIr[];
  crossfilters: CrossFilterIr[];
  templates: TemplateIr[];
}

export interface SelectQueryPartialIr {
  columns: Column[];
  relations: string[];
}

export interface SelectQueryIr extends SelectQueryPartialIr {
  query: string;
}

export interface SelectBodyIr {
  relations: string[];
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
  value: string;
}

export type ExpressionValue = DielIr | RelationIr | DerivedRelationIr | Column | SelectQueryIr | SelectQueryPartialIr | InsertQueryIr | InsertQueryIr[] | ProgramSpecIr | string | string[] | ProgramsIr | SelectBodyIr | CrossFilterIr | CrossFilterChartIr | TemplateIr | TemplateVariableAssignments | JoinClauseIr;