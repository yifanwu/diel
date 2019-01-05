import * as React from "react";
import CodeCell from "./CodeCell";

interface CellState {
}

/**
 * the cell contains code cell
 * & visualization cells (TODO)
 */
export default class Cell extends React.Component<{}, CellState> {
  render() {
    return <>
      <CodeCell/>
    </>;
  }
}