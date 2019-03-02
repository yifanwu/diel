import { DerivedRelation } from "../../parser/dielAstTypes";
import DielRuntime from "../../runtime/DielRuntime";

export enum ChartType {
  BarChart,
  ScatterPlot,
  LineChart
}

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