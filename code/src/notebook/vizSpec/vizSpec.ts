import { DerivedRelation } from "../../parser/dielAstTypes";
import DielRuntime from "../../runtime/DielRuntime";
import { ChartType } from "../../runtime/runtimeTypes";

export interface VizLayout {
  chartHeight: number;
  chartWidth: number;
  marginBottom: number;
  marginRight: number;
  marginTop: number;
  marginLeft: number;
}

export type BrushBox = BrushBoxOneDim | BrushBoxTwoDim;

// both have well defined comparison semantics in SQLite
type FilterValueType = number | string;

export enum BrushBoxType {
  OneDim = "OneDim",
  TwoDim = "TwoDim"
}

export type BrushBoxTwoDim = {
  brushBoxType: BrushBoxType;
  minX: FilterValueType;
  maxX: FilterValueType;
  minY: FilterValueType;
  maxY: FilterValueType;
};

export type BrushBoxOneDim = {
  brushBoxType: BrushBoxType;
  min: FilterValueType;
  max: FilterValueType;
};

export const DefaultVizLayout = {
  chartHeight: 300,
  chartWidth: 400,
  marginBottom: 20,
  marginRight: 20,
  marginTop: 20,
  marginLeft: 20,
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