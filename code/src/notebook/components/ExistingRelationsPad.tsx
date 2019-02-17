import * as React from "react";
import { runtime } from "../setup";
import { Column } from "../../parser/sqlAstTypes";

interface ExistingRelationsPadState {
}

function getColumnsDiv(columns: Column[]) {
  return columns.map(c => {
    return <p className={`column-summary data-type-${c.type}`}>{c.name}</p>;
    });
}

// the logic here needs rethinking
export default class ExistingRelationsPad extends React.Component<{}, ExistingRelationsPadState> {
  render() {
    const original = runtime.IterateOverOriginalRelations(d => {
      return <div className="table-summary">
        {getColumnsDiv(d.columns)}
      </div>;
    });
    return <div className="diel-summary">
      <h2>Original Relations</h2>
      {original}
    </div>;
  }
}