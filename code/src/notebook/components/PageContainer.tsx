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
    <div className="nav-bar">
      <Link to="counter">
        Counter
      </Link>
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
              PitchFork
            </Link>
            &nbsp;
          </>
        : null}
    </div>
    <p>History Features</p>
    <div className="nav-bar">
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
              <Route path="/flights" component={Flights} />
              <Route path="/fires" component={Fires} />
              <Route path="/pitchfork" component={PitchFork} />
            </>
          : null}
      </Switch>
    </div>
  </div>
</Router>);