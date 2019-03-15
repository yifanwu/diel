import * as React from "react";
import CodeCell from "./CodeCell";

interface CellState {
  hi: string;
}

/**
 * the cell contains code cell
 * & visualization cells (TODO)
 */
export default class Cell extends React.Component<{}, CellState> {
  // constructor() {
  //   this.state.hi = "hello";
  // }
  render() {
    return <>
      <CodeCell/>
    </>;
  }
}