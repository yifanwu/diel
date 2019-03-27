import * as React from "react";
import DielComponent from "../diel/DielComponent";
import { ChartType } from "../../../runtime/runtimeTypes";
import { diel } from "../../setup";
import { TwoDimSelection } from "../../vizSpec/vizSpec";
import { MapChart, MapRegion, MapBounds } from "../charts/Map";

enum ComponentRelations {
  fireSpots = "fireSpots",
  fireMapBounds = "fireMapBounds"
}

export default class Fires extends DielComponent<{}> {
  constructor(props: {}) {
    super(props);
    this.BindDielOutputs(Object.keys(ComponentRelations));
  }

  render() {
    const explainDiv = <>
    
    </>;
    const handler = (box: TwoDimSelection) => {
      diel.NewInput("panFireItx", {
        latMin: box.minY,
        latMax: box.maxY,
        longMin: box.minX,
        longMax: box.maxX
      });
    };

    const deselectHandler = () => {
      diel.NewInput("panFireItx", {
        latMin: null,
        latMax: null,
        longMin: null,
        longMax: null
      });
    };

    const controlLayout = {
      chartHeight: 150,
      chartWidth: 200,
      marginBottom: 20,
      marginRight: 20,
      marginTop: 20,
      marginLeft: 20,
    };
    const mapBounds = this.state[ComponentRelations.fireMapBounds] ? this.state[ComponentRelations.fireMapBounds][0] : null;
    const chartDiv = this.state[ComponentRelations.fireSpots]
      ? <MapChart
          spec={{
            chartType: ChartType.Map,
            dimension: 2,
            relationName: ComponentRelations.fireSpots,
            xAttribute: "LONGITUDE",
            yAttribute: "LATITUDE",
            data: this.state[ComponentRelations.fireSpots],
          }}
          mapBounds={mapBounds as MapBounds}
          mapRegion={MapRegion.US}
        />
      : null;
    const controlChartDiv = <MapChart
        spec={{
          chartType: ChartType.Map,
          dimension: 2,
          relationName: "_",
          xAttribute: "",
          yAttribute: "_",
          data: []
        }}
        layout={controlLayout}
        mapRegion={MapRegion.US}
        brushHandler={handler}
        deselectHandler={deselectHandler}
      />;
    return <>
      {chartDiv}
      <br/>
      {controlChartDiv}
    </>;
  }
}
