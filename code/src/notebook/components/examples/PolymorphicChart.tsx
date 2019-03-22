import * as React from "react";
import { BarChart } from "../charts/BarChart";
import { VizSpec } from "../../vizSpec/vizSpec";
import { ChartType, RelationObject } from "../../../runtime/runtimeTypes";
import { LogInternalWarning, LogInternalError } from "../../../lib/messages";

export const PolymorphicChart: React.StatelessComponent<{spec: VizSpec, data: RelationObject}> = (p) => {
  LogInternalWarning(`Not yet implemented`);
  // const {spec, data} = p;
  // let chart: any;
  // if (spec.chartType === ChartType.BarChart) {
  //   const barChartSpec = {
  //     chartType: spec.chartType,
  //     relationName: spec.modifiedQuery.name,
  //     xAttribute: spec.xAxisColumn,
  //     yAttribute: spec.yAxisColumn,
  //     data
  //   };
  //   chart = <BarChart
  //     spec={barChartSpec}
  //   />;
  // } else {
  //   LogInternalWarning(`Other chart types not implemented!`);
  // }
  return <>
    {/* {chart} */}
  </>;
};
