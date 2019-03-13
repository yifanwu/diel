import * as d3 from "d3";
import * as React from "react";
import { ChartSpec } from "../../../runtime/runtimeTypes";
import { FilterValueType, BrushBoxTwoDim, DefaultVizLayout, BrushBoxType, ChartPropShared } from "../../vizSpec/vizSpec";

interface ScatterplotProps extends ChartPropShared {
  spec: ChartSpec;
  selectedDataRange?: {
    minX: FilterValueType; maxX: FilterValueType,
    minY: FilterValueType; maxY: FilterValueType
  };
  brushHandler?: (box: BrushBoxTwoDim) => void;
}

export const Scatterplot: React.StatelessComponent<ScatterplotProps> = (p) => {
  const layout = p.layout ? p.layout : DefaultVizLayout;
  const {data, xAttribute, yAttribute} = p.spec;
  // FIXME: brittle casting
  if (!data) {
    return <p>Data still loading</p>;
  }
  const xValues = data.map(d => d[xAttribute] as number);
  const yValues = data.map(d => d[yAttribute] as number);
  const xDomain = d3.extent(xValues);
  const yDomain = d3.extent(yValues);
  const x = d3.scaleLinear()
              .domain(xDomain)
              .rangeRound([0, layout.chartWidth]);
  const y = d3.scaleLinear()
              .domain(yDomain)
              .rangeRound([layout.chartHeight, 0]);

  // construct the axes
  const axisBottom = d3.axisBottom(x)
                      .ticks(3, "d");
  const axisLeft = d3.axisLeft(y)
                    .ticks(10);

  const color = p.colorSpec ? p.colorSpec.default : "steelblue";
  let brushDiv: JSX.Element = null;
  if (p.brushHandler) {
    const brush = d3.brush()
    .extent([[0, 0], [innerWidth, innerHeight]])
    .on("end", function() {
      // [[x0, y0], [x1, y1]],
      const s = d3.brushSelection(this) as [[number, number], [number, number]];
      if (s !== null) {
        const minX = Math.min(x.invert(s[0][0]), x.invert(s[1][0]));
        const maxX = Math.max(x.invert(s[0][0]), x.invert(s[1][0]));
        const minY = Math.min(y.invert(s[1][1]), y.invert(s[0][1]));
        const maxY = Math.max(y.invert(s[1][1]), y.invert(s[0][1]));
        p.brushHandler({
          brushBoxType: BrushBoxType.TwoDim,
          minX,
          maxX,
          minY,
          maxY
        });
      }
    });
    brushDiv = <g ref={ g => d3.select(g).call(brush) }></g>;
  }
  let circles: JSX.Element[] = null;
  if ((data) && (data.length > 0)) {
    circles = data.map((d, i) => <circle r="3" cx={x(d[xAttribute] as number)} cy={y(d[yAttribute] as number)} fill={color} fillOpacity={0.5}></circle> );
  }
  return (
      <svg
        onClick={p.svgClickHandler}
        width={layout.chartWidth + layout.marginLeft + layout.marginRight}height={layout.chartHeight + layout.marginTop + layout.marginBottom}>
        <g transform={"translate(" + layout.marginLeft + "," + layout.marginTop + ")"}>
          <g ref={(g) => d3.select(g).call(axisBottom)}
            transform={"translate(0," + innerHeight + ")"}></g>
          <g ref={(g) => d3.select(g).call(axisLeft)}></g>
          {circles}
          {brushDiv}
        </g>
      </svg>
  );
};