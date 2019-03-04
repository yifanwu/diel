import * as React from "react";

import { diel } from "../../setup";
import { SimpleObject, ChartType } from "../../../runtime/runtimeTypes";
import { BarChart } from "../charts/BarChart";

interface ScoreZoomBarChartState {
  data: SimpleObject[];
}

export default class ScoreZoomBarChart extends React.Component<{}, ScoreZoomBarChartState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      data: []
    };
    diel.NewInput("panZoomEvent", {minScore: 0, maxScore: 100});
    diel.BindOutput("scoreDistribution", this.setCountState.bind(this));
  }
  setCountState(r: {scoreBin: number, count: number}[]) {
    this.setState({data: r});
  }
  render() {
    const spec = {
      chartType: ChartType.BarChart,
      data: this.state.data,
      xAttribute: "scoreBin",
      yAttribute: "count"
    };
    return <>
    <p>A barchart of student score distribution</p>
    <BarChart
      spec={spec}
    />
    </>;
  }
}