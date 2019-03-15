import * as React from "react";
import {BarChart} from "./charts/BarChart";
import { ChartSpecWithQuery } from "../vizSpec/vizSpec";

export interface ToolTipProps {
  xPos: number;
  yPos: number;
  spec: ChartSpecWithQuery;
}

/**
 * right now just implement the barchart tooltip
 * TODO: add more types of charts
 * @param p props
 */
export const ToolTip: React.StatelessComponent<ToolTipProps> = (p) => {
  // TODO: make the tool tip dynamic
  return <div style={{position: "absolute", left: p.xPos, top: p.yPos}}>
    {/* <BarChart
      spec={p.spec}
    /> */}
  </div>;
};