import { SelectionUnit } from "../parser/sqlAstTypes";
import { SimpleColumn } from "../compiler/DielIr";

export type QueryId = number;

export interface DielRuntimeConfig {
  dielFiles: string[];
  mainDbPath?: string;
  workerDbPaths?: string[];
}

export type SimpleObject = {[index: string]: number | string};
interface ChartSpecBase {
  chartType: ChartType;
  data?: SimpleObject[];
  // dimension: number;
}

export type ChartSpec = TwoDimCartesianCoordSpec;

export interface TwoDimCartesianCoordSpec extends ChartSpecBase {
  xAttribute: string;
  yAttribute: string;
}

/**
 * stores information about what relations live in what sources
 * as well as how large a table is
 * should be table oriented...
 *
 */

export enum TableLocation {
  Local = "Local",
  Worker = "Worker",
  Remote = "Remote"
}

// assume that all the access are via some index in array for now
// a bit brittle...
export interface TableMetaData {
  location: TableLocation;
  accessInfo: number;
  rowNumber?: number;
}

export enum ChartType {
  BarChart = "BarChart",
  Scatter = "Scatter",
  LineChart = "LineChart"
}
export enum CellStatus {
  Initial = "Initial",
  Committed = "Committed"
}

/**
 * keeping it as an independent object in case we want to keep track of user interactions?
 * -- though we should probably use DIEL to do that; thinka bout later..
 */
export interface AnnotationSpec extends TwoDimCartesianCoordSpec {
  semanticId: string;
  ast: SelectionUnit;
}

/**
 * hard coding for demo right now
 */
export interface AnnotedSelectionUnit {
  columnSelections: AnnotationSpec[];
  ast: SelectionUnit;
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