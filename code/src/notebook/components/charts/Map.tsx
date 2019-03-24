import * as React from "react";
import { geoPath, geoAlbersUsa } from "d3-geo"
import { ChartPropShared, ChartSpec2DWithData, DefaultVizLayout, TwoDimSelection, SelectionType } from "../../vizSpec/vizSpec";
import d3 = require("d3");
import { LogInternalError, LogInternalWarning } from "../../../lib/messages";

export enum MapRegion {
  US = "US",
  // TODO: world
}

interface MapState {
  geoData: any;
}

export type MapBounds = {latMin: number, latMax: number, longMin: number, longMax: number};

interface MapProp extends ChartPropShared {
  spec: ChartSpec2DWithData;
  mapRegion: MapRegion;
  mapBounds?: MapBounds;
  selectedDataRange?: TwoDimSelection;
  brushHandler?: (box: TwoDimSelection) => void;
  deselectHandler?: () => void;
}

export function mapBoundsToTransform(s: MapBounds, scale: number, width: number, height: number) {
  if (!s) {
    throw new Error("Selection is null");
  }
  let p1 = geoAlbersUsa()
            .scale(scale)
            .translate([width / 2, height / 2]);
  const nw: [number, number] = [s.longMin as number, s.latMax as number];
  const se: [number, number] = [s.longMax as number, s.latMin as number];
  let pnw = p1(nw);
  let pse = p1(se);
  if ((!pnw) || (!pse)) {
    debugger;
    LogInternalWarning(`Selection ${s} out of bounds of USA`);
  }
  let dx = pse[0] - pnw[0];
  let dy = pse[1] - pnw[1];
  // reproject
  let k = 1 / Math.max(dx / width, dy / height);
  let p2 = geoAlbersUsa().scale(scale * k).translate([width / 2, height / 2]);
  pnw = p2(nw);
  pse = p2(se);
  let x = (pnw[0] + pse[0]) / 2;
  let y = (pnw[1] + pse[1]) / 2;
  // console.log("nw", s.nw, "sw", s.se, "input", SCALE, WIDTH, HEIGHT, "pnw", pnw, "pse", pse, "ratios", "transforms", k, x, y);
  if (isNaN(x) || isNaN(y) || isNaN(k)) {
    debugger;
    LogInternalWarning("Transformations are invalid");
  }
  return {
    x,
    y,
    k
  };
}
export interface Transform {
  y: number;
  x: number;
  k: number;
}

export function getTranslatedMapping(t: Transform, scale: number, width: number, height: number) {
  return geoAlbersUsa()
          .scale(scale * t.k)
          .translate([width - t.x, height - t.y]);
}

export class MapChart extends React.Component<MapProp, MapState> {
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
  setGeoData(d: any) {
    this.setState({geoData: d});
  }
  render() {
    const layout = this.props.layout ? this.props.layout : DefaultVizLayout;
    const {data, xAttribute, yAttribute} = this.props.spec;
    if (this.state.geoData) {
      const SCALE = layout.chartWidth * 2;
      let projection = geoAlbersUsa()
        .translate([layout.chartWidth / 2, layout.chartHeight / 2])
        .scale(SCALE);
      if (this.props.mapBounds && this.props.mapBounds.latMax) { // avoid the null corner case
        let t = mapBoundsToTransform(this.props.mapBounds, SCALE, layout.chartWidth, layout.chartHeight);
        projection = getTranslatedMapping(t, SCALE, layout.chartWidth, layout.chartHeight);
      }
      let brushDiv: JSX.Element = null;
      if (this.props.brushHandler) {
        const brushHandler = this.props.brushHandler;
        const brush = d3.brush()
        .extent([[0, 0], [layout.chartWidth, layout.chartHeight]])
        .on("end", function() {
          // [[x0, y0], [x1, y1]],
          const s = d3.brushSelection(this) as [[number, number], [number, number]];
          if (s !== null) {
            // long, lat
            const p1 = projection.invert([s[0][0], s[1][0]]);
            const p2 = projection.invert([s[1][1], s[0][1]]);
            const minY = Math.min(p1[1], p2[1]); // lat
            const maxY = Math.max(p1[1], p2[1]);
            const maxX = Math.max(p1[0], p2[0]); // long
            const minX = Math.min(p1[0], p2[0]);
            brushHandler({
              brushBoxType: SelectionType.TwoDim,
              minX,
              maxX,
              minY,
              maxY
            });
          }
        });
        brushDiv = <g ref={ g => d3.select(g).call(brush) }></g>;
      }
      let circles;
      if (data.length > 0) {
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
        circles = data.map(d => {
          // has to be named latitude or longitude
          const pos = projection([d[longAttribute] as number, d[latAttribute] as number]);
          return <circle
            r={3}
            cx={pos[0]}
            cy={pos[1]}
            fill="lightblue"
          ></circle>;
        });
      }
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
        onClick={this.props.deselectHandler}
        width={layout.chartWidth + layout.marginLeft + layout.marginRight}
        height={layout.chartHeight + layout.marginTop + layout.marginBottom}
        >
        {mapDivs}
        {circles}
        {brushDiv}
      </svg></>;
    } else {
      return <p>Loading map base data</p>;
    }
  }
}