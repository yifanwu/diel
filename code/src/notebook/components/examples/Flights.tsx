import * as React from "react";

import { ChartType } from "../../../runtime/runtimeTypes";
import { diel } from "../../setup";
import DielComponent from "../diel/DielComponent";

enum ComponentRelations {
  delayDistanceByOrigin = "delayDistanceByOrigin",
  allOriginAirports = "allOriginAirports",
  allPastSelections = "allPastSelections",
  currentOriginSelection = "currentOriginSelection",
}

export default class Flights extends DielComponent<{}> {
  constructor(props: {test: string}) {
    super(props);
    console.log("Flight state is being set");
    this.BindDielOutputs(Object.keys(ComponentRelations));
    this.state = {};
  }

  render() {
    const titleDiv = this.state[ComponentRelations.currentOriginSelection] && this.state[ComponentRelations.currentOriginSelection].length > 0
      ? <h3>Delay by Distance: {this.state[ComponentRelations.currentOriginSelection][0].origin}</h3>
      : null;
    const chartDiv = this.Generate2DChart(ChartType.Scatter, ComponentRelations.delayDistanceByOrigin);
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
      </div>
      <div style={{clear: "both"}}></div>
      {pastDiv}
    </>;
    } else {
      return <p>Loading options...</p>;
    }
  }
}