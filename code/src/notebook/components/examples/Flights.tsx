import * as React from "react";

import { RelationObject, ChartType } from "../../../runtime/runtimeTypes";
import { diel } from "../../setup";
import { Scatterplot } from "../charts/ScatterPlot";

interface FlightsState {
  data: RelationObject;
  selectionData: RelationObject;
  pastSelectionData: RelationObject;
}

export default class Flights extends React.Component<{}, FlightsState> {
  constructor(props: {}) {
    super(props);
    diel.BindOutput("delayDistanceByOrigin", this.setData.bind(this));
    diel.BindOutput("allOriginAirports", this.setSelectionData.bind(this));
    diel.BindOutput("allPastSelections", this.setAllPastSelections.bind(this));
    this.state = {
      data: null,
      selectionData: null,
      pastSelectionData: []
    };
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
      ? <Scatterplot
        spec={spec}
      />
      : <p>No result</p>;
    if (this.state.selectionData) {
      const options = this.state.selectionData.map(d => <a onClick={() => diel.NewInput("originSelectionEvent", {origin: d.origin})}>{d.origin}</a>);
      return <>
      <h2>Flight data visualized!</h2>
      <div className="dropdown">
        <button className="dropbtn">Dropdown</button>
        <div className="dropdown-content">{options}</div>
      </div>
      {chartDiv}
      <div>Your past selections: {this.state.pastSelectionData.map(p => <span>{p.origin}</span>)}</div>
    </>;
    } else {
      return <p>Loading options...</p>;
    }
  }
}