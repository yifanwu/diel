import * as React from "react";
import DielComponent from "../diel/DielComponent";
import { ChartType } from "../../../runtime/runtimeTypes";
import { diel } from "../../setup";
import { TwoDimSelection } from "../../vizSpec/vizSpec";

enum ComponentRelations {
  fireSpots = "fireSpots",
}

export default class Fires extends DielComponent<{}> {
  constructor(props: {}) {
    super(props);
    this.BindDielOutputs(Object.keys(ComponentRelations));
  }
  render() {
    const handlers = {
      selectionHandler: (box: TwoDimSelection) => {
        diel.NewInput("panFireItx", {
          latMin: box.minX,
          latMax: box.maxX,
          longMin: box.minY,
          longMax: box.maxY
        });
      }
    };
    const chartDiv = this.GenerateChart(ChartType.Map, ComponentRelations.fireSpots, handlers);
    return <>
      {chartDiv}
    </>;
  }
}
