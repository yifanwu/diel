import * as React from "react";

import { diel } from "../../setup";

interface CounterProp {
  color: string;
}
interface CounterState {
  count: number;
}


export default class DielCounter extends React.Component<CounterProp, CounterState> {
  constructor(props: CounterProp) {
    // console.log(diel);
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
      <p style={{color: this.props.color}}>{this.state.count}</p>
      <button onClick={() => {
        diel.NewInput("click", {a: 1});
      }}>add</button>
      <button onClick={() => {
        diel.NewInput("click", {a: -1});
      }}>sub</button>

    </>;
  }
}