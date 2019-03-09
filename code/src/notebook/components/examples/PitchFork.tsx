import * as React from "react";

import { RelationObject, ChartType } from "../../../runtime/runtimeTypes";
import { diel } from "../../setup";
import { BarChart } from "../charts/BarChart";

interface PitchForkState {
  scoreData: RelationObject;
  yearData: RelationObject;
}

// FIXME: if we set get view on outputs we might not set it when we initially need to
//  diel.GetView("")
export default class PitchFork extends React.Component<{}, PitchForkState> {
  constructor(props: {}) {
    super(props);
    diel.BindOutput("pitchForkScoreDistribution", this.setScoreData.bind(this));
    diel.BindOutput("pitchForkYearDistribution", this.setYearData.bind(this));
    this.state = {
      scoreData: null,
      yearData: null,
    };
  }
  setYearData(r: RelationObject) {
    this.setState({yearData: r});
  }
  setScoreData(r: RelationObject) {
    this.setState({scoreData: r});
  }
  render() {
    const scoreSpec = {
      chartType: ChartType.BarChart,
      data: this.state.scoreData,
      xAttribute: "scoreBin",
      yAttribute: "count"
    };
    const yearSpec = {
      chartType: ChartType.BarChart,
      data: this.state.yearData,
      xAttribute: "yearBin",
      yAttribute: "count"
    };
    return <>
      <h2>This is a demo of 1.88 million pitch fork review data</h2>
      <p>A barchart of score distribution</p>
      <BarChart
        spec={scoreSpec}
      />
      <p>A barchart of year distribution</p>
      <BarChart
        spec={yearSpec}
      />
    </>;
  }
}