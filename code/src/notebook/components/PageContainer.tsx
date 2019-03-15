import * as React from "react";
import WorkPad from "./WorkPad";
import ExistingRelationsPad from "./ExistingRelationsPad";
import {BrowserRouter as Router, Link, Route, Switch} from "react-router-dom";
import Counter from "./examples/Counter";
import ScoreZoomBarChart from "./examples/ScoreZoomBarChart";
import PitchFork from "./examples/PitchFork";
import Flights from "./examples/Flights";
import VizSpecDemo from "./examples/VizSpecDemo";
import { DEMO_WITH_SOCKET, DEMO_WITH_SMALL_WEBWORKER, DEMO_WITH_LARGE_WEBWORKER, DEMO_WITH_WEBWORKER } from "../../compiler/config";

const Notebook = () => (<div>
    <ExistingRelationsPad/>
    <WorkPad/>
  </div>);

export const PageContainer = () => (<Router>
  <div>
    <div id="nav-bar">
      <Link to="notebook">
        Notebook
      </Link>
      &nbsp;
      <Link to="inferViz">
        Infer Visualization
      </Link>
      &nbsp;
      <Link to="counter">
        Counter
      </Link>
      &nbsp;
      <Link to="scoreZoom">
        Zoomable Bar Chart
      </Link>
      &nbsp;
      {DEMO_WITH_SOCKET
        ? <Link to="pitchfork">
          Pitch Fork (Remote)
        </Link>
      : null}
      {DEMO_WITH_SMALL_WEBWORKER || DEMO_WITH_LARGE_WEBWORKER
      ? <Link to="flights">
        Flights (Remote)
      </Link>
      : null}
    </div>
    <div id="main">
      <Switch>
        <Route exact path="/counter" component={Counter}/>
        <Route path="/notebook" component={Notebook}/>
        <Route path="/scoreZoom" component={ScoreZoomBarChart}/>
        {DEMO_WITH_SOCKET ? <Route path="/pitchfork" component={PitchFork} /> : null}
        {DEMO_WITH_WEBWORKER ? <Route path="/" component={Flights} /> : null}
        <Route path="/inferViz" component={VizSpecDemo}/>
      </Switch>
    </div>
  </div>
</Router>);

