import * as React from "react";

import { RelationObject, ChartType } from "../../../runtime/runtimeTypes";
import { diel } from "../../setup";
import { Scatterplot } from "../charts/ScatterPlot";

interface FlightsState {
  data: RelationObject;
  selectionData: RelationObject;
}

export default class Flights extends React.Component<{}, FlightsState> {
  constructor(props: {}) {
    super(props);
    diel.BindOutput("delayDistanceByOrigin", this.setData.bind(this));
    diel.BindOutput("allOriginAirports", this.setSelectionData.bind(this));
    this.state = {
      data: null,
      selectionData: null,
    };
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
      yAttribute: "count"
    };
    const chartDiv = this.state.data
      ? <Scatterplot
        spec={spec}
      />
      : <p>No result</p>;
    if (this.state.selectionData) {
      const options = this.state.selectionData.map(d => <a onClick={() => diel.NewInput("originSelectionEvent", {airportCode: d.origin})}>{d.origin}</a>);
      return <>
      <h2>Flight data visualized!</h2>
      <div className="dropdown">
        <button className="dropbtn">Dropdown</button>
        <div className="dropdown-content">{options}</div>
      </div>
      {chartDiv}
    </>;
    } else {
      return <p>Loading options...</p>;
    }
  }
}