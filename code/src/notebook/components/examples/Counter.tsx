import * as React from "react";

import { diel } from "../../setup";

interface CounterState {
  count: number;
  isToggleOn: boolean;
}

export default class DielCounter extends React.Component<{}, CounterState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      count: 0,
      isToggleOn: true
    };

    diel.BindOutput("currentClick", this.setCountState.bind(this));
    // this.handleClick = this.handleClick.bind(this);
  }
  setCountState(r: {count: number}[]) {
    this.setState({count: r[0].count});
  }

  // handleClick() {
  //   diel.checkConstraints = !this.state.isToggleOn;
  //   this.setState(prevState => ({
  //     isToggleOn: !prevState.isToggleOn
  //   }));
  // }

  render() {
    return <>
      <p style={{color: "green"}}>{this.state.count}</p>
      <button onClick={() => {
        diel.NewInput("click", {delta: 1});
      }}>add</button>
      <button onClick={() => {
        diel.NewInput("click", {delta: -1});
      }}>sub</button>

      {/* <button onClick={this.handleClick}>
        {this.state.isToggleOn ? "ON" : "OFF"}
      </button> */}
    </>;
  }
}