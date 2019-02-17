import * as React from "react";
import { ToolTip, ToolTipProps } from "./ToolTip";
import { runtime } from "../setup";
// FIXME: this import is really sketch, we should break the two files apart
import { AnnotedSelectionUnit, ChartData, AnnotationSpec, CellStatus } from "../../runtime/runtimeTypes";
import { CodeDiv } from "./CodeDiv";

interface CodeCardState {
  cellStatus: CellStatus;
  query: string;
  annotation: AnnotedSelectionUnit;
  toolTipProps: ToolTipProps;
}

export default class CodeCell extends React.Component<{}, CodeCardState> {

  constructor(props: {}) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.addQuery = this.addQuery.bind(this);
    // this.handleKeyPress = this.handleKeyPress.bind(this);
    this.state = {
      query: "",
      cellStatus: CellStatus.Initial,
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

  // handleKeyPress(e: any) {
  //   if (e.nativeEvent.keyCode === 13) {
  //     if (e.nativeEvent.shiftKey) {
  //       this.refreshAnnotation();
  //     }
  //   }
  // }

  onChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    this.setState({query: event.target.value });
  }

  addQuery() {
    // const annotation = runtime.AddQuery(this.state.query);
    // this.setState({
    //   annotation,
    //   cellStatus: CellStatus.Committed
    // });
  }

  render() {
    return (<div className="code-cell">
      { this.state.toolTipProps ? <ToolTip {...this.state.toolTipProps}/> : null }
      <textarea
        rows={5}
        cols={50}
        id="comments"
        name="comments"
        onChange={ this.onChange }
        // onKeyUp = { this.handleKeyPress }
        >
      </textarea>
      <button className="submit-query" onClick={this.addQuery}>run query</button>
      { this.state.annotation
        ? <CodeDiv
          annotation={this.state.annotation}
          setPopup={this.setPopup}
        />
        : null
      }
    </div>);
  }
}