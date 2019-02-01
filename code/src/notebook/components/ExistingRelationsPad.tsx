import * as React from "react";
import { runtime } from "../setup";

interface ExistingRelationsPadState {
}

// the logic here needs rethinking
export default class ExistingRelationsPad extends React.Component<{}, ExistingRelationsPadState> {
  render() {
    return <div className="">
    {runtime.ast.dynamicTables.map(d => {
      return <div className="table-summary">
        {d.columns.map(c => {
        return <p className={`column-summary data-type-${c.type}`}>{c.name}</p>;
        })}
      </div>;
    })}
    </div>;
  }
}