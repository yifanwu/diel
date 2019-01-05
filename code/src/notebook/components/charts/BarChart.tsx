import * as React from "react";
import * as d3 from "d3";
import { ChartData } from "../../../runtime/runtimeTypes";

interface BarChartProp {
  data: ChartData;
  chartHeight?: number;
  chartWidth?: number;
  yMax?: number;
  color?: string;
}

/**
 * going to hardcode this to categorical for now (cast numbers to strings)
 * @param p props
 */
export const BarChart: React.StatelessComponent<BarChartProp> = (p) => {
  let y = d3.scaleLinear().rangeRound([p.chartHeight, 0]).domain([0, p.yMax]);
  // #brittle
  const xDomain = p.data.data.map(d => d[0].toString());
  const x = d3.scaleBand().rangeRound([0, p.chartWidth]).padding(0.4).domain(xDomain);
  const barWidth = x.bandwidth();
  const bars =  p.data.data.map((d, idx) => {
    const yPos = y(d[1] as number);
    return <rect
      className={"select-bars"}
      x={x(xDomain[idx])}
      y={yPos}
      width={barWidth}
      height={p.chartHeight - yPos}
      fill={p.color}
    ></rect>;
  });
  return <svg>
    {bars}
  </svg>;
};