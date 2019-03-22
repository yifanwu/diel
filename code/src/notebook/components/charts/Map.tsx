import * as React from "react";
import { geoAlbersUsa, geoPath } from "d3-geo"
import { ChartPropShared, ChartSpec2DWithData, FilterValueType, OneDimSelection, DefaultVizLayout, TwoDimSelection } from "../../vizSpec/vizSpec";
import d3 = require("d3");
import { LogInternalError } from "../../../lib/messages";

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
  selectedDataRange?: TwoDimSelection;
  panHandler?: (box: TwoDimSelection) => void;
}

// TODO: http://bl.ocks.org/michellechandra/0b2ce4923dc9b5809922
export class Map extends React.Component<MapProp, MapState> {
  // FIXME
  constructor(props: MapProp) {
    super(props);
    // we also need to do the fetching!
    const self = this;
    this.state = {
      geoData: null
    };
    d3.json("UI-dist/us-states.json", function(json) {
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
    if (this.state.geoData) {
      let projection = geoAlbersUsa()
        .translate([layout.chartWidth / 2, layout.chartHeight / 2])
        .scale(1000);
      let latAttribute = xAttribute;
      let longAttribute = yAttribute;
      if (xAttribute.toLocaleUpperCase() !== "LATITUDE") {
        if ((yAttribute.toLocaleUpperCase() !== "LATITUDE") || (xAttribute.toLocaleUpperCase() !== "LONGITUDE")) {
          LogInternalError(`Maps have to be LATITUDE or LONGITUDE!`);
        }
        latAttribute = yAttribute;
        longAttribute = xAttribute;
      } else {
        if ((yAttribute.toLocaleUpperCase() !== "LONGITUDE")) {
          LogInternalError(`Maps have to be LATITUDE or LONGITUDE!`);
        }
      }
      let zoomDiv = null;
      if (this.props.panHandler) {
        const {panHandler} = this.props;
        const zoom = d3.zoom()
                       .scaleExtent([1, 8])
                       .on("zoom", function() {
                        const t = d3.event.transform;
                        const s = d3.event.transform.k;
                        console.log("t", t, "s", s);
                        // panHandler()
                              // d3.event.translate.join(",")+")scale("+d3.event.scale+")");
                       });
        zoomDiv = <g ref={ g => d3.select(g).call(zoom) }></g>;
      }
      const circles = data.map(d => {
        // has to be named latitude or longitude
        const pos = projection([d[longAttribute] as number, d[latAttribute] as number]);
        return <circle
          r={3}
          cx={pos[0]}
          cy={pos[1]}
          fill="lightblue"
        ></circle>;
      });
      const geoGen = geoPath().projection(projection);
      const mapDivs = this.state.geoData.features.map((d: any, i: any) => (
        <path
          key={ `path-${ i }` }
          d={ geoGen(d) }
          fill="steelblue"
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
        {zoomDiv}
      </svg></>;
    } else {
      return <p>Loading map base data</p>;
    }
  }
}