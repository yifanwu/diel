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
    default: string
  };
}

interface ChartSpecBase {
  chartType: ChartType;
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

export function generateVizSpecForSingleQuery(rt: DielRuntime, q: DerivedRelation): VizSpec {
  let spec = null;
  const r = rt.db.exec(``);
  console.log("%c TESTING", "color: red");
  return spec;
}