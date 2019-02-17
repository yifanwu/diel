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
    const staticRelations = runtime.compiler.ast.originalRelations.map(d => {
      return <div className="table-summary">
        {getColumnsDiv(d.columns)}
      </div>;
    });
    const inputRelations = runtime.compiler.ast.inputs.map(i => {
      return <div className="table-summary">
        {getColumnsDiv(i.columns)}
      </div>;
    });
    return <div className="diel-summary">
      <h2>Static Relations</h2>
      {staticRelations}
      <h2>Input Relations</h2>
      {inputRelations}
    </div>;
  }
}