import * as React from "react";
import { ChartData } from "../../../code/src/runtime/runtimeTypes";
import {BarChart} from "./charts/BarChart";

interface ToolTipProps {
  x: number;
  y: number;
  maxWidth?: number;
  data: ChartData;
}

/**
 * right now just implement the barchart tooltip
 * TODO: add more types of charts
 * @param p props
 */
export const ToolTip: React.StatelessComponent<ToolTipProps> = (p) => {
  // TODO: make the tool tip dynamic
  return <div style={{position: "absolute", left: p.x, top: p.y}}>
    <BarChart
      data={p.data}
    />
  </div>;
};