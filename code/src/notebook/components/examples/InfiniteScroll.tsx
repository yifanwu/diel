import * as React from "react";

import DielComponent from "../diel/DielComponent";
import { Table } from "../charts/Table";

enum ComponentRelations {
  flightScrollResult = "flightScrollResult",
}

export default class InfiniteScroll extends DielComponent<{}> {
  constructor(props: {}) {
    super(props);
    this.BindDielOutputs(Object.keys(ComponentRelations));
    this.state = {};
  }
  render() {
    if (this.state[ComponentRelations.flightScrollResult]) {
      return <Table
        data={this.state[ComponentRelations.flightScrollResult]}
      />;
    } else {
      return <p>Loading</p>;
    }
  }
}