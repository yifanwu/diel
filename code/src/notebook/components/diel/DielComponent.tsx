import * as React from "react";
// follwoing:
// - second case here: https://stackoverflow.com/questions/35677235/how-to-extend-a-react-component
// also to mkae polymorphic: https://stackoverflow.com/questions/49432454/flow-is-not-a-polymorphic-type

import { diel } from "../../setup";
import { RelationObject, ChartType } from "../../../runtime/runtimeTypes";
import { BarChart } from "../charts/BarChart";
import { Scatterplot } from "../charts/ScatterPlot";
import { RelationIdType } from "../../../compiler/DielPhysicalExecution";
import { LogInternalError, DielInternalErrorType, ReportDielUserError } from "../../../lib/messages";

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
  BindDielOutputs(relationNames: string[]) {
    const self = this;
    relationNames.map(relationName => {
      const fn = (r: RelationObject) => {
        self.setState({[relationName]: r});
      };
      diel.BindOutput(relationName, fn);
    });
  }
  Generate2DChart (chartType: ChartType, relationName: RelationIdType) {
    if (this.state[relationName]) {
      const scales = diel.GetScales(relationName)[0];
      const spec = {
        chartType,
        relationName,
        data: this.state[relationName],
        xAttribute: scales.x as string,
        yAttribute: scales.y as string
      };
      if (chartType === ChartType.BarChart) {
        return <BarChart
          spec={spec}
        />;
      } else if (chartType === ChartType.Scatter) {
        return <Scatterplot
          spec={spec}
        />;
      } else {
        LogInternalError(`Only supports barcharts and scatter plots for now`, DielInternalErrorType.NotImplemented);
      }
    } else {
      return <p>Loading</p>;
    }
  }
}