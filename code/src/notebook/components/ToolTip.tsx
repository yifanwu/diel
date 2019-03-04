import * as React from "react";
import { ChartSpec } from "../../runtime/runtimeTypes";
import {BarChart} from "./charts/BarChart";

export interface ToolTipProps {
  xPos: number;
  yPos: number;
  spec: ChartSpec;
}

/**
 * right now just implement the barchart tooltip
 * TODO: add more types of charts
 * @param p props
 */
export const ToolTip: React.StatelessComponent<ToolTipProps> = (p) => {
  // TODO: make the tool tip dynamic
  return <div style={{position: "absolute", left: p.xPos, top: p.yPos}}>
    <BarChart
      spec={p.spec}
    />
  </div>;
};