import * as React from "react";
import {BrowserRouter as Router, Link, Route, Switch} from "react-router-dom";
import Counter from "./examples/Counter";
import PitchFork from "./examples/PitchFork";
import Flights from "./examples/Flights";
import { DEMO_WITH_SOCKET, DEMO_WITH_WEBWORKER } from "../../compiler/config";
import Fires from "./examples/Fires";
import ExampleUndo from "./examples/ExampleUndo";


export const PageContainer = () => {

  return <Router>
    <div>
      <h2>Welcome to DIEL!</h2>
      <p>
        DIEL is a new framework for interative applications to declaratively scale
        to backend and WebWorker based engines.
        Some resources: <a href="https://github.com/yifanwu/diel">source code</a>, paper, tutorial etc. to come!
        {/* <a href="./files/diel.pdf">paper</a>. */}
      </p>
      <p>
        Checkout <Link to="counter">Counter</Link> for the hello-world example. <Link to="fires">Fires</Link> for an example using map, and <Link to="flights">Flights</Link> for scatter plots and historgrams. And an example for <Link to="undo">Undo</Link>.
        There are a few known bugs in the gallery code that we are fixing---if you get stuck, <b>refreshing the page</b> will do the trick!
        All these demos are driven by DIEL code---you can find the source <a href="https://github.com/yifanwu/diel">here</a>. We on working on putting the source side by side with the demos and adding more examples. Stay tuned!
      </p>
      <Switch>
        <Route exact path="/counter" component={Counter}/>
        <Route path="/undo" component={ExampleUndo}/>
        {(DEMO_WITH_WEBWORKER || DEMO_WITH_SOCKET)
          ? <>
              <Route path="/flights" component={Flights} />
              <Route path="/fires" component={Fires} />
              {/* <Route path="/pitchfork" component={PitchFork} /> */}
            </>
          : null}
      </Switch>
    </div>
    </Router>;
  };