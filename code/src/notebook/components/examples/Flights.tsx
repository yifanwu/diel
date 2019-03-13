import * as React from "react";

import { RelationObject, ChartType, RecordObject } from "../../../runtime/runtimeTypes";
import { diel } from "../../setup";
import { Scatterplot } from "../charts/ScatterPlot";

interface FlightsState {
  data: RelationObject;
  currentSelection: RecordObject;
  selectionData: RelationObject;
  pastSelectionData: RelationObject;
}

export default class Flights extends React.Component<{}, FlightsState> {
  constructor(props: {}) {
    super(props);
    diel.BindOutput("delayDistanceByOrigin", this.setData.bind(this));
    diel.BindOutput("allOriginAirports", this.setSelectionData.bind(this));
    diel.BindOutput("allPastSelections", this.setAllPastSelections.bind(this));
    diel.BindOutput("currentOriginSelection", this.setCurrentSelection.bind(this));
    console.log("Flight state is being set");
    this.state = {
      data: null,
      selectionData: null,
      pastSelectionData: [],
      currentSelection: null
    };
  }

  setCurrentSelection(r: RelationObject) {
    if (r && r.length > 0) {
      this.setState({currentSelection: r[0]});
    }
  }

  setAllPastSelections(r: RelationObject) {
    this.setState({pastSelectionData: r});
  }

  setSelectionData(r: RelationObject) {
    this.setState({selectionData: r});
  }

  setData(r: RelationObject) {
    this.setState({data: r});
  }

  render() {
    const spec = {
      chartType: ChartType.Scatter,
      data: this.state.data,
      xAttribute: "delay",
      yAttribute: "distance"
    };
    const chartDiv = this.state.data
      ? <>
        <h3>{this.state.currentSelection.origin} Flight Distance (y) by Delay (x) Distribution</h3>
        <Scatterplot
          spec={spec}
        /></>
      : <p>No result</p>;
    if (this.state.selectionData) {
      const options = this.state.selectionData.map(d => <a
          className="selection-options"
          onClick={() => diel.NewInput("originSelectionEvent", {origin: d.origin})}
        >{d.origin}</a>);
      return <>
      <h2>Flight data visualized!</h2>
      <div className="top-nav">
        {/* <button className="dropbtn">Dropdown</button> */}
        {options}
      </div>
      <div>
        {chartDiv}
      </div>
      <div style={{clear: "both"}}></div>
      <div>Your past selections: {this.state.pastSelectionData.map(p => <span>{p.origin},</span>)}</div>
    </>;
    } else {
      return <p>Loading options...</p>;
    }
  }
}