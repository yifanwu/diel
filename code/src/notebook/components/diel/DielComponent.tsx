import * as React from "react";
// follwoing:
// - second case here: https://stackoverflow.com/questions/35677235/how-to-extend-a-react-component
// also to mkae polymorphic: https://stackoverflow.com/questions/49432454/flow-is-not-a-polymorphic-type

import { diel } from "../../setup";
import { RelationObject, ChartType } from "../../../runtime/runtimeTypes";
import { BarChart } from "../charts/BarChart";
import { Scatterplot } from "../charts/ScatterPlot";
import { RelationIdType } from "../../../compiler/DielPhysicalExecution";
import { LogInternalError, DielInternalErrorType } from "../../../lib/messages";
import { DielSelection, ChartSpec3DWithData, ChartSpec2DWithData } from "../../vizSpec/vizSpec";

export interface DielHanders {
  selectionHandler?: (box: DielSelection) => void;
  deSelectHandler?: () => void;
}

interface DielComponentState {
  [index: string]: RelationObject;
}
/**
 * DielComponenet have the state prespecified
 */
export default class DielComponent<P> extends React.Component<P, DielComponentState>  {
  // setData(r: string[]) {
  //   this.setState({hi: "hi"});
  // }
  constructor(props: P) {
    super(props);
    this.GenerateChart = this.GenerateChart.bind(this);
    this.state = {};

  }
  BindDielOutputs(relationNames: string[]) {
    const self = this;
    relationNames.map(relationName => {
      const fn = (r: RelationObject) => {
        self.setState({[relationName]: r});
      };
      diel.BindOutput(relationName, fn);
    });
  }

  GenerateChart (chartType: ChartType, relationName: RelationIdType, handlers?: DielHanders) {
    if (this.state[relationName]) {
      const scales = diel.GetScales(relationName)[0];
      const dimension = scales.dimension as number;
      const data = this.state[relationName];
      const xAttribute = scales.x as string;
      const yAttribute = scales.y as string;
      let spec = (dimension === 2)
        ? {
          chartType,
          dimension,
          relationName,
          data,
          xAttribute,
          yAttribute
        } as ChartSpec2DWithData
      : {
        chartType,
        dimension,
        relationName,
        data,
        xAttribute,
        yAttribute,
        zAttribute: scales.z as string
      } as ChartSpec3DWithData;
      if (chartType === ChartType.BarChart) {
        return <BarChart
          spec={spec}
          brushHandler={handlers ? handlers.selectionHandler : null}
          svgClickHandler={handlers ? handlers.deSelectHandler : null}
        />;
      } else if (chartType === ChartType.Scatter) {
        return <Scatterplot
          spec={spec}
          brushHandler={handlers ? handlers.selectionHandler : null}
        />;
      } else {
        LogInternalError(`Only supports barcharts and scatter plots for now`, DielInternalErrorType.NotImplemented);
      }
    } else {
      console.log(`The state of relation ${relationName} has not being set`);
      return <p>Loading</p>;
    }
  }
}

// else if (chartType === ChartType.Map) {
//   return <MapChart
//     spec={spec}
//     // hard code for now..
//     mapRegion={MapRegion.US}
//   />;
//   // LogInternalError(`The API for the Map ChartType is not complete yet`);
// }