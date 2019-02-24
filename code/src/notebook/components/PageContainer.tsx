import * as React from "react";
import WorkPad from "./WorkPad";
import ExistingRelationsPad from "./ExistingRelationsPad";
import {BrowserRouter as Router, Link, Route, Switch} from "react-router-dom";
import { Examples } from "./Examples";

const Notebook = () => (<div>
    <ExistingRelationsPad/>
    <WorkPad/>
  </div>);

export const PageContainer = () => (<Router>
  <div>
    <div id="nav-bar">
      <Link to="examples">
        Examples
      </Link>
    </div>
    <div id="main">
      <Switch>
        <Route exact path="/" component={Examples}/>
        <Route path="/examples" component={Notebook}/>
      </Switch>
    </div>
  </div>
</Router>);

