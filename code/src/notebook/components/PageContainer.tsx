import * as React from "react";
import WorkPad from "./WorkPad";
import ExistingRelationsPad from "./ExistingRelationsPad";
import {BrowserRouter as Router, Link, Route, Switch} from "react-router-dom";
import Counter from "./examples/Counter";
// import ScoreZoomBarChart from "./examples/ScoreZoomBarChart";
import PitchFork from "./examples/PitchFork";
import Flights from "./examples/Flights";
import VizSpecDemo from "./examples/VizSpecDemo";
import { DEMO_WITH_SOCKET, DEMO_WITH_SMALL_WEBWORKER, DEMO_WITH_LARGE_WEBWORKER, DEMO_WITH_WEBWORKER } from "../../compiler/config";
import Fires from "./examples/Fires";
import ExampleUndo from "./examples/ExampleUndo";

const Notebook = () => (<div>
    <ExistingRelationsPad/>
    <WorkPad/>
  </div>);

export const PageContainer = () => (<Router>
  <div>
    <div className="top-nav">
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
      &nbsp;
      {(DEMO_WITH_WEBWORKER || DEMO_WITH_SOCKET)
        ? <>
            <Link to="flights">
              Flights
            </Link>
            &nbsp;
            <Link to="fires">
              Fires
            </Link>
            &nbsp;
            <Link to="pitchfork">
              Pitch Fork (Remote)
            </Link>
            &nbsp;
          </>
        : null}
    </div>
    <div className="top-nav">
      <p>More advanced DIEL uses</p>
      <Link to="undo">
          Undo
        </Link>
        &nbsp;
    </div>
    <div id="main">
      <Switch>
        <Route exact path="/counter" component={Counter}/>
        <Route path="/undo" component={ExampleUndo}/>
        {(DEMO_WITH_WEBWORKER || DEMO_WITH_SOCKET)
          ? <>
              <Route path="/" component={Flights} />
              <Route path="/fires" component={Fires} />
              <Route path="/pitchfork" component={PitchFork} />
            </>
          : null}
        {/* <Route path="/inferViz" component={VizSpecDemo}/> */}
        {/* <Route path="/notebook" component={Notebook}/> */}
      </Switch>
    </div>
  </div>
</Router>);

