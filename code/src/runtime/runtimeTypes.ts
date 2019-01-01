import { SelectionUnit } from "../parser/sqlAstTypes";

export type QueryId = number;

export enum ChartDataType {
  OneDim = "OneDim",
  TwoDim = "TwoDim"
}

// might need some metadata in the future...
export interface ChartData {
  type: ChartDataType;
}

export interface TwoDimData extends ChartData {
  x: number;
  y: number;
  z: string | number;
}

export interface OneDimData extends ChartData {
  x: string | number;
  y: number;
}

/**
 * There is an intersting question of whether we should generate the AST (and map to query)
 * or generate the query directly...
 * - pro for ast is that it's a bit more robust than just string manipulation...
 */
export interface RuntimeColumnSelectionInfo {
  ast: SelectionUnit;
  cached?: {
    query: string;
    result: OneDimData[];
  };
}

/**
 * keeping it as an independent object in case we want to keep track of user interactions?
 * -- though we should probably use DIEL to do that; thinka bout later..
 */
export interface AnnotateColumnSelection {
  rtSelectionUnit: RuntimeColumnSelectionInfo;
}

/**
 * hard coding for demo right now
 */
export interface AnnotedSelectionUnit {
  columnSelections: AnnotateColumnSelection[];
}

/**
 * For now derived cannot be interactable
 */
export enum CellType {
  Basic,
  Interactable,
  Derived,
}

/**
 * - these queries will be simple ones for now (at least for the demo #DEMOHACK)
 * - runtime queries will be versioned, and the annotation corresponds to the most recent
 * - the raw selection unit will be in the bigger AST, in public views
 * - once a query is made interactable, it cannot be edited in the cells anymore
 * - upon undo, the index moves, and if there is a new version created,
 *   the versions after will be deleted
 */
export interface RuntimeCell {
  cId: QueryId; // immutable
  cName: string; // user can change
  cType: CellType;
  // TODO: this will be good context for figuring out what the user is interested in
  // isHideen: boolean;
  versions: string[];
  currentVersionIdx: number;
  currentAnnotions: AnnotedSelectionUnit;
}