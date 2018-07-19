// must return all the possible types that the intermediate nodes can return
// for now it's just strings; can add to later

export enum DataType {
  String,
  Integer
}

export enum RelationType {
  Stream,
  View,
  Table,
  TransferView,
  RemoteView
}

export interface TransferInfo {
  depViews: string;
  location: string;
}

export interface Column {
  name: string;
  type: DataType;
}

export interface RelationInfo {
  name: string;
  columns: Column[];
  relationType: RelationType;
  transferInfo?: TransferInfo;
  // instead of keeping the AST of the view we will just store the generated string
  spec: string;
}

export interface CombinedResult {
  relations: RelationInfo[];
}

export type ExpressionValue = string | CombinedResult;