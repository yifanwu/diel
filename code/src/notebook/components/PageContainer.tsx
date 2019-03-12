import * as React from "react";
import WorkPad from "./WorkPad";
import ExistingRelationsPad from "./ExistingRelationsPad";
import {BrowserRouter as Router, Link, Route, Switch} from "react-router-dom";
import Counter from "./examples/Counter";
import ScoreZoomBarChart from "./examples/ScoreZoomBarChart";
import LinkedBarCharts from "./examples/LinkedBarCharts";
import PitchFork from "./examples/PitchFork";
import Flights from "./examples/Flights";

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
      <Link to="counter">
        Counter
      </Link>
      &nbsp;
      <Link to="scoreZoom">
        Zoomable Bar Chart
      </Link>
      &nbsp;
      <Link to="linkedCharts">
        Linked Bar Chart
      </Link>
      &nbsp;
      <Link to="pitchfork">
        Pitch Fork (Remote)
      </Link>
      <Link to="flights">
        Flights (Remote)
      </Link>
    </div>
    <div id="main">
      <Switch>
        {/* <Route exact path="/counter" component={Counter}/>
        <Route path="/notebook" component={Notebook}/>
        <Route path="/scoreZoom" component={ScoreZoomBarChart}/>
        <Route path="/linkedCharts" component={LinkedBarCharts}/>
        <Route path="/pitchfork" component={PitchFork} /> */}
        <Route path="/" component={Flights} />
      </Switch>
    </div>
  </div>
</Router>);

