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

/**
 * 
 */
function generateUIElements(ir: ) {

}