// import * as React from "react";

// import { diel } from "../../setup";
// import { ChartType, RelationObject } from "../../../runtime/runtimeTypes";
// import { BarChart } from "../charts/BarChart";
// import { BrushBoxOneDim } from "../../vizSpec/vizSpec";

// interface ScoreZoomBarChartState {
//   data: RelationObject;
// }

// export default class ScoreZoomBarChart extends React.Component<{}, ScoreZoomBarChartState> {
//   constructor(props: {}) {
//     super(props);
//     this.state = {
//       data: []
//     };
//     diel.BindOutput("scoreDistribution", this.setCountState.bind(this));
//   }
//   setCountState(r: {scoreBin: number, count: number}[]) {
//     this.setState({data: r});
//   }
//   componentDidMount() {
//     diel.NewInput("panZoomEvent", {minScore: 0, maxScore: 100});
//   }
//   render() {
//     const spec = {
//       chartType: ChartType.BarChart,
//       relationName: "scoreDistribution",
//       data: this.state.data,
//       xAttribute: "scoreBin",
//       yAttribute: "count"
//     };
//     return <>
//       <p>A barchart of student score distribution</p>
//       <BarChart
//         spec={spec}
//       />
//     </>;
//   }
// }