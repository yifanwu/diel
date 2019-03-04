import { DerivedRelation } from "../../parser/dielAstTypes";
import DielRuntime from "../../runtime/DielRuntime";
import { ChartType } from "../../runtime/runtimeTypes";

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