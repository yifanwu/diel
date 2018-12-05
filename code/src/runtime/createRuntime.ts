import { DielAst } from "../parser/dielAstTypes";
import { getDielAst } from "../compiler/compiler";
import { ColumnSelection, SelectionUnit, getRelationReferenceName } from "../parser/sqlAstTypes";
import { Statement, Database } from "sql.js";

enum ChartDataType {
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

enum VisualizationType {
  CategoricalBar = "CategoricalBar",
  OrdinalBar = "OrdinalBar",
  Scatter = "Scatter"
}

interface AnnotateColumnSelection extends ColumnSelection {
  getValues: () => OneDimData[];
  // TODO: add some metadata information as a layer of abstract to the UI Element.
}

interface UIElement {
  // todo
  hasNewLine: boolean;
  indentLevel: number;
  // current
  text: string;
  dataFetch: () => ChartData[];
  visualizationType: VisualizationType;
}

/**
 * hard coding for demo right now
 */
interface AnnotedSelectionUnit {
  // we are going to have a single SelectionUnit
  // each selection is going to have a function
  // will be a mix of annotated and original.
  columnSelections: AnnotateColumnSelection[];
  // TODO
}

// just gonna linearize this for now...
function generateUIElement(ir: AnnotedSelectionUnit): UIElement[] {

}

function annotateAst(ast: SelectionUnit): AnnotedSelectionUnit {
  // return a different IR
  // right now just hard code and see what we can expand to
  // the selection
  const columnSelections = ast.columnSelections.map(s => {
    // massive hardcoding for now...

  });
  return {
    columnSelections
  }
}

type QueryId = number;

interface RuntimeQuery {
  qId: QueryId;
  version: number;
  ast: SelectionUnit;
  annoted: AnnotedSelectionUnit;
  linkedQueries: QueryId[];
}

/**
 * takes in a query
 * generates the IR
 * also creatre the APIs for querying a single column
 */
export class DielRuntime {
  queries: RuntimeQuery[];
  db: Database;
  constructor(db?: Database) {
    this.queries = [];
    if (!db) {
      this.db = new Database();
    } else {
      this.db = db;
    }
  }
  getQueryById(qId: QueryId) {
    return this.queries[qId];
  }
  generateQId() {
    return this.queries.length;
  }
  addQuery(query: string) {
    return {
      qId: this.generateQId(),
      version: 0,
      ast: 
    };
  }
  walkAnnotation() {
    // hard coded for now --- going to walk trhough the
    // AnnotedSelectionUnit, return the string, the function, and the visualization type
  }

}