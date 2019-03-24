import * as React from "react";

import { ChartType } from "../../../runtime/runtimeTypes";
import { diel } from "../../setup";
import DielComponent from "../diel/DielComponent";
import { OneDimSelection } from "../../vizSpec/vizSpec";

enum ComponentRelations {
  allOriginAirports = "allOriginAirports",
  allPastSelections = "allPastSelections",
  currentOriginSelection = "currentOriginSelection",
  delayDistanceByOrigin = "delayDistanceByOrigin",
  flightDistribution = "flightDistribution",
}

export default class Flights extends DielComponent<{}> {
  constructor(props: {}) {
    super(props);
    console.log("Flight state is being set");
    this.BindDielOutputs(Object.keys(ComponentRelations));
    this.state = {};
  }

  render() {

    const zoomBrushHandler = (box: OneDimSelection) => {
      diel.NewInput("panZoomEvent", {minDelay: box.min, maxDelay: box.max});
    };
    const zoomSvgClickHandler = () => diel.NewInput("panZoomEvent", {minDelay: null, maxDelay: null});

    const titleDiv = this.state[ComponentRelations.currentOriginSelection] && this.state[ComponentRelations.currentOriginSelection].length > 0
      ? <h3>Delay by Distance: {this.state[ComponentRelations.currentOriginSelection][0].origin}</h3>
      : null;
    const chartDiv = this.GenerateChart(ChartType.Scatter, ComponentRelations.delayDistanceByOrigin);
    const delayDistChartDiv = this.GenerateChart(ChartType.BarChart, ComponentRelations.flightDistribution, {
      selectionHandler: zoomBrushHandler,
      deSelectHandler: zoomSvgClickHandler
    });
    const pastDiv = this.state[ComponentRelations.allPastSelections]
      ? <div>Your past selections: {this.state[ComponentRelations.allPastSelections].map(p => <span>{p.origin},</span>)}</div>
      : null;
    if (this.state[ComponentRelations.allOriginAirports]) {
      const options = this.state[ComponentRelations.allOriginAirports].map(d => <a
          className="selection-options"
          onClick={() => diel.NewInput("originSelectionEvent", {origin: d.origin})}
        >{d.origin}</a>);
      return <>
      <h2>Flight data visualized!</h2>
      <div className="top-nav">
        {options}
      </div>
      <div>
        {titleDiv}
        {chartDiv}
        {delayDistChartDiv}
      </div>
      <div style={{clear: "both"}}></div>
      {pastDiv}
    </>;
    } else {
      return <p>Loading options...</p>;
    }
  }
}