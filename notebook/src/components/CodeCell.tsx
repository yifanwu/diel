import * as React from "react";
import { ToolTip } from "./ToolTip";
import { runtime } from "../setup";
// FIXME: this import is really sketch, we should break the two files apart
import { AnnotedSelectionUnit, ChartData } from "../../../code/src/runtime/runtimeTypes";
import { CodeDiv } from "./CodeDiv";

interface CodeCardState {
  query: string;
  annotation: AnnotedSelectionUnit;
  popup: {
    data: ChartData,
    position: {
      x: number;
      y: number;
    }
  };
}

export default class CodeCard extends React.Component<{}, CodeCardState> {

  constructor(props: {}) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.state = {
      query: "",
      annotation: null,
      popup: null,
    };
  }

  setPopup() {
    // todo
  }

  handleKeyPress(e: any) {
    if (e.nativeEvent.keyCode === 13) {
      if (e.nativeEvent.shiftKey) {
        this.refreshAnnotation();
      }
    }
  }

  onChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    this.setState({query: event.target.value });
  }

  refreshAnnotation() {
    // const abstractUi = runtime.addQuery(this.state.query);
    // this.setState({abstractUi});
  }

  render() {
    return (<div className="code-card">
      <textarea
        rows={5}
        cols={50}
        id="comments"
        name="comments"
        onChange={ this.onChange }
        onKeyUp = { this.handleKeyPress }
        >
      </textarea>
      <CodeDiv
        annotation={this.state.annotation}
        setPopup={this.setPopup}
      />
    </div>);
  }
}