import * as React from "react";
import {BrowserRouter as Router, Link, Route, Switch} from "react-router-dom";
import Counter from "./examples/Counter";
import PitchFork from "./examples/PitchFork";
import Flights from "./examples/Flights";
import { DEMO_WITH_SOCKET, DEMO_WITH_WEBWORKER } from "../../compiler/config";
import Fires from "./examples/Fires";
import ExampleUndo from "./examples/ExampleUndo";


export const PageContainer = () => {
  const introText = <>
    <h2>Welcome to DIEL!</h2>
    <p>DIEL is a new framework for interative applications to declaratively scale
      to backend and WebWorker based engines.</p>
    <p>You can find a copy of our paper here: <a href="./files/diel.pdf"></a>, but we have some cool demos to share</p>
    <p>For the demos below, there will be a button next to the widgets that you can click to show a popup
      of the query that's driving the example.
      You can also find the <a href="https://github.com/yifanwu/diel">source code</a>.
    </p>
  </>;
  return <>
  {introText}
  <Router>
    <div>
      <div>
        The <Link to="counter">Counter</Link> example is the hello-world example.
      </div>
      <div className="nav-bar">
        &nbsp;
        {DEMO_WITH_WEBWORKER
          ? <>
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
        {DEMO_WITH_SOCKET || DEMO_WITH_WEBWORKER
          ? <><Link to="flights">
              Flights
            </Link>
            &nbsp;</>
          : null}
      </div>
      <p>History Related Features</p>
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
  </Router>
  </>;
};