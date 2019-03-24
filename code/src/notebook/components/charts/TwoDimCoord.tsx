import * as d3 from "d3";
import * as React from "react";
import { FilterValueType, TwoDimSelection, DefaultVizLayout, SelectionType, ChartPropShared, ChartSpec2DWithData } from "../../vizSpec/vizSpec";
import { RelationObject } from "../../../runtime/runtimeTypes";

interface TwoDimCoordProps extends ChartPropShared {
  // for scatter, fixed size
  // for heatmap, dynamic color
  // for line chart, reduce to single attribute
  // FIXME: get rid of the any's
  // no need to pass data because it's shared
  shapeGen: (x: any, y: any) => any;
  spec: ChartSpec2DWithData;
  selectedDataRange?: {
    minX: FilterValueType; maxX: FilterValueType,
    minY?: FilterValueType; maxY?: FilterValueType
  };
  brushHandler?: (box: TwoDimSelection) => void;
}

export const TwoDimCoord: React.StatelessComponent<TwoDimCoordProps> = (p) => {
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

  let brushDiv: JSX.Element = null;
  if (p.brushHandler) {
    const brush = d3.brush()
    .extent([[0, 0], [layout.chartWidth, layout.chartHeight]])
    .on("end", function() {
      // [[x0, y0], [x1, y1]],
      const s = d3.brushSelection(this) as [[number, number], [number, number]];
      if (s !== null) {
        const minX = Math.min(x.invert(s[0][0]), x.invert(s[1][0]));
        const maxX = Math.max(x.invert(s[0][0]), x.invert(s[1][0]));
        const minY = Math.min(y.invert(s[1][1]), y.invert(s[0][1]));
        const maxY = Math.max(y.invert(s[1][1]), y.invert(s[0][1]));
        p.brushHandler({
          brushBoxType: SelectionType.TwoDim,
          minX,
          maxX,
          minY,
          maxY
        });
      }
    });
    brushDiv = <g ref={ g => d3.select(g).call(brush) }></g>;
  }
  let shapes: JSX.Element[] = null;
  if ((data) && (data.length > 0)) {
    shapes = p.shapeGen(x, y);
  }
  return (
      <svg
        onClick={p.svgClickHandler}
        width={layout.chartWidth + layout.marginLeft + layout.marginRight}
        height={layout.chartHeight + layout.marginTop + layout.marginBottom}>
        <g transform={"translate(" + layout.marginLeft + "," + layout.marginTop + ")"}>
          <g ref={(g) => d3.select(g).call(axisBottom)}
            transform={"translate(0," + layout.chartHeight + ")"}></g>
          <g ref={(g) => d3.select(g).call(axisLeft)}></g>
          {shapes}
          {brushDiv}
        </g>
      </svg>
  );
};