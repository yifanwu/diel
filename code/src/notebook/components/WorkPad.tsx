import * as React from "react";
import Cell from "./Cell";

/**
 * A bit confused about hte type signiture here; there is too much parametrized types here...
 * following: https://stackoverflow.com/questions/37359194/how-should-i-be-recreating-a-stateful-child-component-in-a-parents-render-metho
 * I don't think I need the cell since there is only one static cell I'm currently working with
 */
interface WorkPadState {
  cells: {key: string}[];
}

export default class WorkPad extends React.Component<{}, WorkPadState> {

  constructor(props: {}) {
    super(props);
    this.addCell = this.addCell.bind(this);
    this.state = {
      cells: [{key: "1"}]
    };
  }

  addCell() {
    this.setState(prevState => {
      prevState.cells.push({
        key: (prevState.cells.length + 1).toString()
      });
      return prevState;
    });
  }

  render() {
    return <div id="work-pad">
      {this.state.cells.map(c => <Cell key={c.key}/>)}
      <button className="new-cell-btn" onClick={this.addCell}>new cell</button>
    </div>;
  }
}