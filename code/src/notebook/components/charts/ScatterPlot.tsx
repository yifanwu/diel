import * as React from "react";
import { FilterValueType, TwoDimSelection, ChartPropShared, ChartSpec2DWithData } from "../../vizSpec/vizSpec";
import { TwoDimCoord } from "./TwoDimCoord";

interface ScatterplotProps extends ChartPropShared {
  spec: ChartSpec2DWithData;
  selectedDataRange?: {
    minX: FilterValueType; maxX: FilterValueType,
    minY: FilterValueType; maxY: FilterValueType
  };
  brushHandler?: (box: TwoDimSelection) => void;
}

export const Scatterplot: React.StatelessComponent<ScatterplotProps> = (p) => {
  const color = p.colorSpec ? p.colorSpec.default : "steelblue";
  const {data, xAttribute, yAttribute} = p.spec;
  const shapeGen = (x: any, y: any) => {
    return data.map((d, _) => <circle r="3" cx={x(d[xAttribute] as number)} cy={y(d[yAttribute] as number)} fill={color} fillOpacity={0.5}></circle>);
  };
  return <TwoDimCoord
    shapeGen={shapeGen}
    {...p}
    brushHandler={p.brushHandler}
  />;
};