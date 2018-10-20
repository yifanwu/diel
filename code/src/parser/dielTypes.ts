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

// changing to strings for the ease of reading
// export enum RelationType {
//   Input = "Input",
//   Output = "Output",
//   View = "View",
//   Table = "Table"
// }

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
export interface DerivedRelationIr {
  name: string;
  columns: Column[];
  query: string;
}

export interface InsertQueryIr {
  relation: string;
  query: string;
  // dependentRelations: string[];
}

// keeping the relation helps us build the dependency graph later

export interface ProgramSpecIr {
  selectPrograms: SelectQueryIr[];
  insertPrograms: InsertQueryIr[];
}

export interface ProgramsIr extends ProgramSpecIr {
  input: string;
};

export interface DielIr {
  inputs: RelationIr[];
  tables: RelationIr[];
  outputs: DerivedRelationIr[];
  views: DerivedRelationIr[];
  programs: ProgramsIr[];
}

export interface SelectQueryPartialIr {
  columns: Column[];
  relations: string[];
}

export interface SelectQueryIr extends SelectQueryPartialIr{
  query: string;
}

export interface SelectBodyIr {
  relations: string[];
} 

export type ExpressionValue = DielIr | RelationIr | DerivedRelationIr | Column | SelectQueryIr | SelectQueryPartialIr | InsertQueryIr | InsertQueryIr[] | ProgramSpecIr | string | string[] | ProgramsIr | SelectBodyIr;