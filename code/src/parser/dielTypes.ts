// must return all the possible types that the intermediate nodes can return
// for now it's just strings; can add to later

export enum DataType {
  String = "String",
  Number = "Number",
  Boolean = "Boolean"
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

export interface DielIr {
  inputs: InputIr[];
  outputs: OutputIr[];
}

export interface OutputIrPartial {
  columns: Column[];
  query: string;
}

export type ExpressionValue = DielIr | InputIr | OutputIr | Column | OutputIrPartial | string;