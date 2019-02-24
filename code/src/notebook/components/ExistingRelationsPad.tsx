import * as React from "react";
import { diel } from "../setup";
import { Column } from "../../parser/sqlAstTypes";

interface ExistingRelationsPadState {
}

function getColumnsDiv(columns: Column[]) {
  return columns.map(c => {
    return <th className={`data-type-${c.type}`}>{c.name}</th>;
    });
}

// the logic here needs rethinking
export default class ExistingRelationsPad extends React.Component<{}, ExistingRelationsPadState> {
  render() {
    const original = diel.ir.GetOriginalRelations().map(d => {
      return <table className={`table-summary table-type-${d.relationType}`}>
      <caption>{d.name}</caption>
        <thead>
          <tr>
            {getColumnsDiv(d.columns)}
          </tr>
        </thead>
      </table>;
    });
    return <div id="relation-summary">
      <h3>Original Relations</h3>
      {original}
    </div>;
  }
}