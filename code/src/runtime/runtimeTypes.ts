import { SelectionUnit } from "../parser/sqlAstTypes";
import { SimpleColumn } from "../compiler/DielIr";

export type QueryId = number;

export interface DielRuntimeConfig {
  dielFiles: string[];
  mainDbPath?: string;
  workerDbPaths?: string[];
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
  Bar = "Bar",
  Scatter = "Scatter"
}

export enum CellStatus {
  Initial = "Initial",
  Committed = "Committed"
}

export type DbRow = {[index: string]: number | string};

export interface AnnotatedRows {
  columnTypes: SimpleColumn[];
  data: DbRow[];
}

interface ChartSpec {
  chartType: ChartType;
  dimension: number;
}

/**
 * #IMPROVE can do some generics here.
 */
export interface ChartData extends ChartSpec {
  data: DbRow[];
}

/**
 * keeping it as an independent object in case we want to keep track of user interactions?
 * -- though we should probably use DIEL to do that; thinka bout later..
 */
export interface AnnotationSpec extends ChartSpec {
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