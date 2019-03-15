import * as React from "react";
import { BarChart } from "../charts/BarChart";
import { VizSpec } from "../../vizSpec/vizSpec";
import { ChartType, RelationObject } from "../../../runtime/runtimeTypes";
import { LogInternalWarning } from "../../../lib/messages";

export const PolymorphicChart: React.StatelessComponent<{spec: VizSpec, data: RelationObject}> = (p) => {
  const {spec, data} = p;
  let chart: any;
  if (spec.chartType === ChartType.BarChart) {
    const barChartSpec = {
      chartType: spec.chartType,
      relationName: spec.modifiedQuery.name,
      xAttribute: spec.xAxisColumn,
      yAttribute: spec.yAxisColumn,
      data
    };
    chart = <BarChart
      spec={barChartSpec}
    />;
  } else {
    LogInternalWarning(`Other chart types not implemented!`);
  }
  return <>
    {chart}
  </>;
};
