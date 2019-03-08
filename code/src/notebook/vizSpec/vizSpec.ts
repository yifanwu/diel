import { DerivedRelation } from "../../parser/dielAstTypes";
import DielRuntime from "../../runtime/DielRuntime";
import { ChartType, RelationObject } from "../../runtime/runtimeTypes";

export interface VizLayout {
  chartHeight: number;
  chartWidth: number;
  marginBottom: number;
  marginRight: number;
  marginTop: number;
  marginLeft: number;
}

export interface ChartPropShared {
  layout?: VizLayout;
  svgClickHandler?: () => void;
  colorSpec?: {
    selected?: string,
    default?: string,
    // the following is to support multiple series
    defaultMultiple?: string[];
  };
}

export const DefaultColorSpec = {
  selected: "orange",
  default: "steelblue",
  // max out at 10, in whcih case we complain
  defaultMultiple: d3ScaleChromatic.schemeCategory10
};

interface ChartSpecBase {
  chartType: ChartType;
  dimension: number;
  relationName: string;
}

export type ChartSpecWithQuery = ChartSpec2DWithQuery;


export interface ChartSpecBase2D extends ChartSpecBase {
  xAttribute: string;
  yAttribute: string;
}

export interface ChartSpec2DWithQuery extends ChartSpecBase2D {
  modifiedQuery: DerivedRelation;
}

/**
 * overloading map data with this, since lat/long is also just x and y, after some projection
 */
export interface ChartSpec2DWithData extends ChartSpecBase2D {
  data: RelationObject;
}

export interface ChartSpec3DWithData extends ChartSpec2DWithData {
  zAttribute: string;
}

export type ChartSpecWithData = ChartSpec2DWithData | ChartSpec3DWithData;

export type DielSelection = OneDimSelection | TwoDimSelection;

// both have well defined comparison semantics in SQLite
export type FilterValueType = number | string;

export enum SelectionType {
  OneDim = "OneDim",
  TwoDim = "TwoDim"
}


export type TwoDimSelection = {
  brushBoxType: SelectionType;
  minX: FilterValueType;
  maxX: FilterValueType;
  minY: FilterValueType;
  maxY: FilterValueType;
};

export type OneDimSelection = {
  brushBoxType: SelectionType;
  min: FilterValueType;
  max: FilterValueType;
};

export const DefaultVizLayout = {
  chartHeight: 300,
  chartWidth: 400,
  marginBottom: 20,
  marginRight: 20,
  marginTop: 20,
  marginLeft: 40,
};

export interface VizSpec {
  chartType: ChartType;
  modifiedQuery: DerivedRelation;
  xAxisColumn: string;
  yAxisColumn: string;
}

// handles simple queries only
export function generateVizSpecForSingleQuery(rt: DielRuntime, q: DerivedRelation): VizSpec {
  let selection: CompositeSelectionUnit = q.selection.compositeSelections[0] //TODO: multiple composite selections
  let columnSelections: ColumnSelection[] = selection.relation.columnSelections //
  
  let spec : VizSpec = null
  
  let timeColumns: ColumnSelection[] = []
  let numericColumns: ColumnSelection[] = []
  let uselessColumns: ColumnSelection[] = []
  
  for (let c of columnSelections) {
    if (c.expr.dataType == DataType.TimeStamp) {
      timeColumns.push(c);
    } else if (c.expr.dataType == DataType.Number) {
      numericColumns.push(c);
    } else {
      uselessColumns.push(c);
    } 
  }
  if (timeColumns.length + numericColumns.length == 0) {
    return spec
  } else if (timeColumns.length + numericColumns.length == 1) {
    
    var combined = timeColumns.concat(numericColumns);
    var columnName = (combined[0].alias) ? combined[0].alias : combined[0].expr; //how to get column name

    
    const r = rt.db.exec(`select count() from ${q.name} group by `);
  } else if (timeColumns.length + numericColumns.length == 2) {

  } else {
    return spec
  }
  const r = rt.db.exec(`select count() from totalWorkerClickEvents`);
  console.log("%c TESTING", "color: red");
  return spec;
}