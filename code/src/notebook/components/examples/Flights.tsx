import * as React from "react";

import { ChartType } from "../../../runtime/runtimeTypes";
import { diel } from "../../setup";
import DielComponent from "../diel/DielComponent";
import { OneDimSelection, TwoDimSelection } from "../../vizSpec/vizSpec";

enum ComponentRelations {
  allOriginAirports = "allOriginAirports",
  allPastSelections = "allPastSelections",
  currentOriginSelection = "currentOriginSelection",
  delayDistanceByOrigin = "delayDistanceByOrigin",
  flightDistribution = "flightDistribution",
  delayByDistance = "delayByDistance",
}

export default class Flights extends DielComponent<{}> {
  constructor(props: {}) {
    super(props);
    console.log("Flight state is being set");
    this.BindDielOutputs(Object.keys(ComponentRelations));
    this.state = {};
    diel.NewInput("zoomScatterItx", {minDelay: 0, maxDelay: 100, minDistance: 0, maxDistance: 800});
    // insert into  values (0, 100, 0, 800);")
  }

  render() {

    const zoomBrushHandler = (box: OneDimSelection) => {
      diel.NewInput("panZoomEvent", {minDelay: box.min, maxDelay: box.max});
    };
    const scatterZoomHandler = (box: TwoDimSelection) => {
      diel.NewInput("zoomScatterItx", {
        minDelay: box.minX,
        maxDelay: box.maxX,
        minDistance: box.minY,
        maxDistance: box.maxY});
    };
    const zoomSvgClickHandler = () => diel.NewInput("panZoomEvent", {minDelay: null, maxDelay: null});

    const selectedAiport = this.state[ComponentRelations.currentOriginSelection]
      ? this.state[ComponentRelations.currentOriginSelection].length > 0
        ? this.state[ComponentRelations.currentOriginSelection][0].origin
        : null
      : null;
    const titleDiv = selectedAiport
      ? <>
        <h3>Delay by Distance for Origin Airport: {selectedAiport}</h3>
        </>
      : <h3></h3>;
    const chartDiv = this.GenerateChart(ChartType.Scatter, ComponentRelations.delayDistanceByOrigin);
    const scatterSampleDiv = this.GenerateChart(ChartType.Scatter, ComponentRelations.delayByDistance,
      {selectionHandler: scatterZoomHandler});
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
      <h1>Flight Data</h1>
      <h2>Scatterplot of flight delay by distance (sampled)</h2>
      <p>You can brush on a region to zoom in for more details. Or click on the chart to deselect.</p>
      {scatterSampleDiv}
      <h2>Filter by Aiport</h2>
      <div className="top-nav">
        {options}
      </div>
      <h2>Distribution of flight delay {selectedAiport ? `Filtered by ${selectedAiport}` : ""}</h2>
      <p>You can brush on the distribution to .  If you click on an origin airport, the airport delay will show on the side as well.</p>
      {delayDistChartDiv}
      {titleDiv}
      {chartDiv}
      <div style={{clear: "both"}}></div>
      {pastDiv}
    </>;
    } else {
      return <p>Loading options...</p>;
    }
  }
}