import * as React from "react";
import { diel } from "../../setup";
import { DerivedRelation, RelationType, SetOperator, AstType, DataType } from "../../../parser/dielAstTypes";
import { RelationObject } from "../../../runtime/runtimeTypes";
import { generateVizSpecForSingleQuery, VizSpec } from "../../vizSpec/vizSpec";
import { getSelectionUnitAst, getVanillaSelectionUnitAst } from "../../../compiler/compiler";
import { PolymorphicChart } from "./PolymorphicChart";
import { ExprColumnAst, ExprType } from "../../../parser/exprAstTypes";
import { normalizeColumnForSelectionUnit } from "../../../compiler/passes/normalizeColumnSelection";
import { generateSqlViews } from "../../../compiler/codegen/codeGenSql";
import { CreateDerivedSelectionSqlAstFromDielAst } from "../../../compiler/codegen/createSqlIr";

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
    "create view temp as select delay from flights"
    "delay from flights"
    "select flights.delay from flights"
    // compile query first!
    const r = diel.db.exec("create view bins as select delta from click");
    const selectionUnitAst = getVanillaSelectionUnitAst("select delay from flights");
    normalizeColumnForSelectionUnit(selectionUnitAst, {ir: diel.ir});
    const s = JSON.stringify(Math.random());     
    for (let c of selectionUnitAst.derivedColumnSelections) {
      if (c.expr.exprType == ExprType.Column) {
        (c.expr as ExprColumnAst).relationName = "";
      }
    }     
    const derivedRelationAst: DerivedRelation = {
      name: "bins", // brittle!
      relationType: RelationType.View,
      selection: {
        astType: AstType.RelationSelection,
        compositeSelections: [{op: SetOperator.NA, relation: selectionUnitAst}]
      }
    };
    // DEPENDENCY, generateVizSpecForSingleQuery reads from the IR,
    //   which is modified by the AddView
    
    
    const vizSpec = generateVizSpecForSingleQuery(diel, derivedRelationAst);

    const queryStr = generateSqlViews(CreateDerivedSelectionSqlAstFromDielAst(vizSpec.modifiedQuery));

    // diel.db.exec(queryStr);
    diel.AddView(vizSpec.modifiedQuery);
    this.setState({
      data: diel.simpleGetLocal('bins')
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


