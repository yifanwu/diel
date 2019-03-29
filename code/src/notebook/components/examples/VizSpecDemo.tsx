import * as React from "react";
import { diel } from "../../setup";
import { DerivedRelation, RelationType, SetOperator, AstType } from "../../../parser/dielAstTypes";
import { RelationObject } from "../../../runtime/runtimeTypes";
import { generateVizSpecForSingleQuery, VizSpec } from "../../vizSpec/vizSpec";
import { getSelectionUnitAst } from "../../../compiler/compiler";
import { PolymorphicChart } from "./PolymorphicChart";

interface VizSpecDemoState {
  userQuery: string;
  viewName: string;
  derivedQuery: DerivedRelation;
  data: RelationObject;
  vizSpec: VizSpec;
}

export default class VizSpecDemo extends React.Component<{}, VizSpecDemoState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      userQuery: "",
      viewName: "TMP",
      derivedQuery: null,
      data: null,
      vizSpec: null,
    };
  }

  onUserQueryChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    this.setState({userQuery: event.target.value });
  }

  subQuery() {
    // compile query first!
    const selectionUnitAst = getSelectionUnitAst(this.state.userQuery);
    const derivedRelationAst: DerivedRelation = {
      name: this.state.viewName, // brittle!
      relationType: RelationType.View,
      selection: {
        astType: AstType.RelationSelection,
        compositeSelections: [{op: SetOperator.NA, relation: selectionUnitAst}]
      }
    };
    // DEPENDENCY, generateVizSpecForSingleQuery reads from the IR,
    //   which is modified by the AddView
    diel.AddView(derivedRelationAst);
    const vizSpec = generateVizSpecForSingleQuery(diel, derivedRelationAst);
    diel.AddView(vizSpec.modifiedQuery);
    this.setState({
      data: diel.simpleGetLocal(this.state.viewName)
    });
  }

  render() {
    const chart = this.state.data && this.state.vizSpec
      ? <PolymorphicChart
        spec={this.state.vizSpec}
        data={this.state.data}
      />
      : null;
    return <>
      <textarea
        rows={5}
        cols={50}
        id="comments"
        name="comments"
        onChange={ this.onUserQueryChange.bind(this) }
      />
      <button className="submit-query" onClick={this.subQuery.bind(this)}>run query</button>
      {chart}
    </>;
  }
}


