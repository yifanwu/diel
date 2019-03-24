import * as React from "react";
import { RelationObject } from "../../../runtime/runtimeTypes";

interface TableProps {
  data: RelationObject;
}

export const Table: React.StatelessComponent<TableProps> = (p) => {
  let rows = [];
  for (let i = 0; i < p.data.length; i++) {
    let rowID = `row${i}`;
    let cell = [];
    for (let idx = 0; idx < this.state.size; idx++) {
      let cellID = `cell${i}-${idx}`;
      cell.push(<td key={cellID} id={cellID}></td>);
    }
    rows.push(<tr key={i} id={rowID}>{cell}</tr>);
  }
  return(
    <div className="container">
      <div className="row">
        <div className="col s12 board">
          <table id="simple-board">
              <tbody>
                {rows}
              </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
