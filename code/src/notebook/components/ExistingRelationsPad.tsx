import * as React from "react";
import { runtime } from "../setup";

interface ExistingRelationsPadState {
}

// the logic here needs rethinking
export default class ExistingRelationsPad extends React.Component<{}, ExistingRelationsPadState> {
  render() {
    return <div className="">
    {runtime.ast.dynamicTables.map(d => {
      return <div className="table-sum">
        {d.columns.map(c => {
          return <p>{c.name}</p>;
        })}
      </div>;
    })}
    </div>;
  }
}