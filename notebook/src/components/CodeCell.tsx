import * as React from "react";
import { ToolTip } from "./ToolTip";
import { runtime } from "../setup";
// FIXME: this import is really sketch, we should break the two files apart
import { AnnotedSelectionUnit, ChartData, AnnotationSpec } from "../../../code/src/runtime/runtimeTypes";
import { CodeDiv } from "./CodeDiv";
import { SelectionUnit } from "../../../code/src/parser/sqlAstTypes";

interface ToolTipProps {
  chartData: ChartData;
  xPos: number;
  yPos: number;
}

interface CodeCardState {
  query: string;
  annotation: AnnotedSelectionUnit;
  toolTipProps: ToolTipProps;
}

export default class CodeCard extends React.Component<{}, CodeCardState> {

  constructor(props: {}) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.state = {
      query: "",
      annotation: null,
      toolTipProps: null,
    };
  }

  /**
   * this function should take the query, execute it, and show the visualization
   */
  setPopup(spec: AnnotationSpec, xPos: number, yPos: number) {
    // todo
    const chartData = {
      data: runtime.ExecuteAstQuery(spec.ast),
      dimension: spec.dimension,
      chartType: spec.chartType
    };
    const popup: ToolTipProps = {
      chartData,
      xPos,
      yPos
    };
    this.setState({toolTipProps: popup});
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