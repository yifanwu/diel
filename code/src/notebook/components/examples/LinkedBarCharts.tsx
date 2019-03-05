import * as React from "react";

import { diel } from "../../setup";
import { SimpleObject, ChartType } from "../../../runtime/runtimeTypes";
import { BarChart } from "../charts/BarChart";
import { BrushBoxOneDim } from "../../vizSpec/vizSpec";

interface LinkedBarChartsState {
  scoreData: SimpleObject[];
  gradeData: SimpleObject[];
  selectedScore: SimpleObject[];
}

export default class LinkedBarCharts extends React.Component<{}, LinkedBarChartsState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      scoreData: diel.GetView("scoreDistributionStatic") as any,
      selectedScore: null,
      gradeData: null
    };
    diel.BindOutput("gradDistributedLinked", this.setGradDistributedLinked.bind(this));
    diel.BindOutput("currentFilter", this.setSelectedScore.bind(this));
  }
  setSelectedScore(r: {minScore: number, maxScore: number}[]) {
    this.setState({selectedScore: r});
  }
  setGradDistributedLinked(r: {grade: number, count: number}[]) {
    this.setState({gradeData: r});
  }
  componentDidMount() {
    diel.NewInput("filterChartEvent", {minScore: 0, maxScore: 100});
  }
  render() {
    const scoreSpec = {
      chartType: ChartType.BarChart,
      data: this.state.scoreData,
      xAttribute: "scoreBin",
      yAttribute: "count"
    };
    const gradSpec = {
      chartType: ChartType.BarChart,
      data: this.state.gradeData,
      xAttribute: "grade",
      yAttribute: "count"
    };
    const selected = this.state.selectedScore
      ? {
          min: this.state.selectedScore[0]["minScore"],
          max: this.state.selectedScore[0]["maxScore"]
        }
      : null;
    return <>
      <p>A barchart of student score distribution</p>
      <BarChart
        spec={scoreSpec}
        brushHandler={(box: BrushBoxOneDim) => {
          diel.NewInput("filterChartEvent", {minScore: box.min, maxScore: box.max});
        }}
        selectedDataRange={selected}
        svgClickHandler={() => diel.NewInput("filterChartEvent", {minScore: 0, maxScore: 100})}
      />
      <BarChart
        spec={gradSpec}
      />
    </>;
  }
}