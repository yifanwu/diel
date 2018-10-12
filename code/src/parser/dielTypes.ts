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

export interface InputIr {
  name: string;
  columns: Column[];
}

export interface OutputIr {
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
  inputs: InputIr[];
  outputs: OutputIr[];
  programs: ProgramsIr[];
}

export interface SelectQueryIr {
  columns: Column[];
  query: string;
}

export type ExpressionValue = DielIr | InputIr | OutputIr | Column | SelectQueryIr | InsertQueryIr | InsertQueryIr[] | ProgramSpecIr | string | string[] | ProgramsIr;