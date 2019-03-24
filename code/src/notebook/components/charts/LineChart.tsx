import * as React from "react";
import { FilterValueType, TwoDimSelection, ChartPropShared, ChartSpec2DWithData } from "../../vizSpec/vizSpec";
import { TwoDimCoord } from "./TwoDimCoord";
import * as d3 from "d3";
import { RecordObject } from "../../../runtime/runtimeTypes";

interface LineChartProps extends ChartPropShared {
  spec: ChartSpec2DWithData;
  selectedDataRange?: {
    minX: FilterValueType; maxX: FilterValueType,
  };
  brushHandler?: (box: TwoDimSelection) => void;
}

export const LineChart: React.StatelessComponent<LineChartProps> = (p) => {
  const color = p.colorSpec ? p.colorSpec.default : "steelblue";
  const {data, xAttribute, yAttribute} = p.spec;

  const shapeGen = (x: any, y: any) => {
    let lineMapping = d3.line<RecordObject>().x((d) => x(d[xAttribute])).y((d) => y(d[yAttribute]));
    let line = lineMapping(data);
    return <path stroke={color} fill="none" stroke-wdith="1.5" d={line}></path>;
  };
  return <TwoDimCoord
    shapeGen={shapeGen}
    {...p}
  />;
};