import * as React from "react";
import * as d3 from "d3";
import { ChartSpec } from "../../../runtime/runtimeTypes";

interface BarChartProp {
  spec: ChartSpec;
  chartHeight?: number;
  chartWidth?: number;
  color?: string;
}

/**
 * going to hardcode this to categorical for now (cast numbers to strings)
 * @param p props
 */
export const BarChart: React.StatelessComponent<BarChartProp> = (p) => {
  console.log("props", p);
  const color = p.color ? p.color : "blue";
  const chartHeight = p.chartHeight ? p.chartHeight : 200;
  const chartWidth = p.chartWidth ? p.chartWidth : 300;
  const yDomain = d3.extent(p.spec.data.map(d => d[p.spec.yAttribute] as number));
  let y = d3.scaleLinear().rangeRound([chartHeight, 0]).domain(yDomain);
  const xDomain = p.spec.data.map(d => d[p.spec.xAttribute].toString());
  const x = d3.scaleBand().rangeRound([0, chartWidth]).padding(0.4).domain(xDomain);
  const barWidth = x.bandwidth();
  const bars =  p.spec.data.map((d, idx) => {
    const yPos = y(d[p.spec.yAttribute] as number);
    return <rect
      className={"select-bars"}
      x={x(xDomain[idx])}
      y={yPos}
      width={barWidth}
      height={chartHeight - yPos}
      fill={color}
    ></rect>;
  });
  return <svg>
    {bars}
  </svg>;
};