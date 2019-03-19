import * as React from "react";
import DielComponent from "../diel/DielComponent";
import { ChartType } from "../../../runtime/runtimeTypes";

enum ComponentRelations {
  fireSpots = "fireSpots",
}

export default class Fires extends DielComponent<{}> {
  constructor(props: {}) {
    super(props);
  }
  render() {
    const chartDiv = this.Generate2DChart.bind(this)(ChartType.Map, ComponentRelations.fireSpots);
    return <>
      {chartDiv}
    </>;
  }
}
