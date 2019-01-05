import * as React from "react";
import WorkPad from "./WorkPad";
import ExistingRelationsPad from "./ExistingRelationsPad";

export const PageContainer = () => (<div className="wrapper">
  <WorkPad/>
  <ExistingRelationsPad/>
</div>);