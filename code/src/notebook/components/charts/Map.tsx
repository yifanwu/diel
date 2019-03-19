import * as React from "react";
import { geoAlbersUsa, geoPath } from "d3-geo"
import { ChartPropShared, ChartSpec2DWithData, FilterValueType, BrushBoxOneDim, DefaultVizLayout } from "../../vizSpec/vizSpec";
import d3 = require("d3");

export enum MapRegion {
  US = "US",
  // TODO: world
}

interface MapState {
  geoData: any;
}

interface MapProp extends ChartPropShared {
  spec: ChartSpec2DWithData;
  mapRegion: MapRegion;
  mapGeoData: any;
  selectedDataRange?: {min: FilterValueType; max: FilterValueType};
  brushHandler?: (box: BrushBoxOneDim) => void;
}

// TODO: http://bl.ocks.org/michellechandra/0b2ce4923dc9b5809922
export default class Map extends React.Component<MapProp, MapState> {
  // FIXME
  constructor(props: MapProp) {
    super(props);
    // we also need to do the fetching!
    const self = this;
    d3.json("us-states.json", function(json) {
      self.setGeoData(json);
    });
  }
  // projection() {
  //   return geoMercator()
  //     .scale(100)
  //     .translate([ 800 / 2, 450 / 2 ]);
  // }
  setGeoData(d: any) {
    this.setState({geoData: d});
  }
  render() {
    const layout = this.props.layout ? this.props.layout : DefaultVizLayout;
    const {data, xAttribute, yAttribute} = this.props.spec;
    let projection = geoAlbersUsa()
        .translate([layout.chartWidth / 2, layout.chartHeight / 2])
        .scale(1000);
    const circles = data.map(d => {
      const pos = projection([d[xAttribute] as number, d[yAttribute] as number]);
      return <circle
        r={3}
        cx={pos[0]}
        cy={pos[1]}
      ></circle>;
    });
    const mapDivs = this.state.geoData.map((d: any, i: any) => (
      <path
        key={ `path-${ i }` }
        d={ geoPath().projection(projection)(d) }
        fill={ `blue` }
        stroke="#FFFFFF"
        strokeWidth={ 0.5 }
      />
    ));
    return <><svg
      width={layout.chartWidth + layout.marginLeft + layout.marginRight}
      height={layout.chartHeight + layout.marginTop + layout.marginBottom}
      >
      {mapDivs}
      {circles}
    </svg></>;
  }
};