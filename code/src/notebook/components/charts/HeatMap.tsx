import * as React from "react";
import * as d3 from "d3";

import { FilterValueType, BrushBoxTwoDim, ChartPropShared, ChartSpec3DWithData } from "../../vizSpec/vizSpec";
import { TwoDimCoord } from "./TwoDimCoord";

interface HeatMapProps extends ChartPropShared {
  spec: ChartSpec3DWithData;
  colorRange: {
    minColor: string;
    maxColor: string;
  };
  selectedDataRange?: {
    minX: FilterValueType; maxX: FilterValueType,
    minY: FilterValueType; maxY: FilterValueType
  };
  brushHandler?: (box: BrushBoxTwoDim) => void;
  // add panHandlers...
  // panHandler
}

export const HeatMap: React.StatelessComponent<HeatMapProps> = (p) => {
  const colorScale = d3.interpolateRgb(p.colorRange.minColor, p.colorRange.maxColor);
  const {data, xAttribute, zAttribute, yAttribute} = p.spec;
  const zValues = data.map(d => d[xAttribute] as number);
  const zDomain = d3.extent(zValues);
  const zScale = d3.scaleLog()
                    .domain(zDomain)
                    .range([0, 1]);
  // fixme: adjust to the current width/height
  const rectWidth = p.layout.chartWidth / data.length;
  const rectHeight = p.layout.chartHeight / data.length;
  const shapeGen = (x: any, y: any) => {
    data.map((d, _) => <rect
      width={rectWidth}
      height={rectHeight}
      x={x(d[xAttribute] as number)}
      y={y(d[yAttribute] as number)}
      fill={colorScale(zScale(d[zAttribute] as number))}
      fillOpacity={1}
      ></rect>);
  };
  return <TwoDimCoord
    shapeGen={shapeGen}
    {...p}
  />;
};