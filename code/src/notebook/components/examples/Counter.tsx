import * as React from "react";

import { diel } from "../../setup";

interface CounterState {
  count: number;
}

export default class DielCounter extends React.Component<{}, CounterState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      count: 0
    };
    diel.BindOutput("currentClick", this.setCountState.bind(this));
  }
  setCountState(r: {count: number}[]) {
    this.setState({count: r[0].count});
  }
  render() {
    return <>
      <p style={{color: "green"}}>{this.state.count}</p>
      <button onClick={() => {
        diel.NewInput("click", {delta: 1});
      }}>add</button>
      <button onClick={() => {
        diel.NewInput("click", {delta: -1});
      }}>sub</button>
    </>;
  }
}