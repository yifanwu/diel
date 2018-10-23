import { AbstractParseTreeVisitor } from "antlr4ts/tree";
import * as parser from "./grammar/DIELParser";
import * as visitor from "./grammar/DIELVisitor";

import { ExpressionValue, Column, RelationIr, DerivedRelationIr, SelectQueryIr, ProgramSpecIr, ProgramsIr, InsertQueryIr, SelectBodyIr, SelectQueryPartialIr, CrossFilterChartIr, CrossFilterIr, TemplateIr, TemplateVariableAssignments, JoinClauseIr } from "./dielTypes";
import { parseColumnType, getCtxSourceCode } from "../compiler/helper";

export default class Visitor extends AbstractParseTreeVisitor<ExpressionValue>
implements visitor.DIELVisitor<ExpressionValue> {
  private templates: TemplateIr[];
  private inputs: RelationIr[];
  private tables: RelationIr[];
  private views: DerivedRelationIr[];
  private outputs: DerivedRelationIr[];

  defaultResult() {
    return "";
  }

  visitQueries = (ctx: parser.QueriesContext) => {
    // should only be called once and executed for setup.
    const inputs: RelationIr[] = ctx.inputStmt().map(e => (
      this.visitInputStmt(e)
    ));
    this.inputs = inputs;
    const tables: RelationIr[] = ctx.tableStmt().map(e => (
      this.visit(e) as RelationIr
    ));
    this.tables = tables;
    const outputs: DerivedRelationIr[] = ctx.outputStmt().map(e => (
      this.visit(e) as DerivedRelationIr
    ));
    const views: DerivedRelationIr[] = ctx.viewStmt().map(e => (
      this.visit(e) as DerivedRelationIr
    ));
    const programs: ProgramsIr[] = ctx.programStmt().map(e => (
      this.visit(e) as ProgramsIr
    ));
    const crossfilters: CrossFilterIr[] = ctx.programStmt().map(e => (
      this.visit(e) as CrossFilterIr
    ));
    const templates: TemplateIr[] = ctx.templateStmt().map(e => (
      this.visit(e) as TemplateIr
    ));
    return {
      inputs,
      tables,
      outputs,
      views,
      programs,
      crossfilters,
      templates
    };
  }

  // outputs
  visitOutputStmt(ctx: parser.OutputStmtContext): DerivedRelationIr {
    const name = ctx.IDENTIFIER().text;
    const s = this.visit(ctx.selectQuery()) as SelectQueryIr;
    return {
      name,
      ...s
    };
  }

  visitSelectQueryDirect(ctx: parser.SelectQueryDirectContext) {
    // this is lazy, assume union or intersection to a hve the same columns
    const firstQuery = this.visit(ctx.selectUnitQuery()) as SelectQueryIr;
    const query = getCtxSourceCode(ctx);
    return {
      query,
      ...firstQuery,
    };
  }

  visitSelectQueryTemplate(ctx: parser.SelectQueryTemplateContext) {
    const values = ctx.variableAssignment().map(v => this.visit(v) as TemplateVariableAssignments);
    const templateName = ctx._templateName.text;
    const t = this.templates.find(i => i.templateName === templateName);
    return this._getTemplate(t, values);
  }

  visitViewStmt(ctx: parser.ViewStmtContext): DerivedRelationIr {
    const name = ctx.IDENTIFIER().text;
    const s = this.visit(ctx.selectQuery()) as SelectQueryIr;
    return {
      name,
      ...s
    };
  }

  visitTemplateStmt(ctx: parser.TemplateStmtContext): TemplateIr {
    const templateName = ctx._templateName.text;
    // make sure that this is expected
    const variables = ctx.IDENTIFIER().map(i => i.text);
    const query = this.visit(ctx.selectQuery()) as SelectQueryIr;
    return {
      templateName,
      variables,
      query: query.query,
    };
  }

  // TODO: do some type checking/inference on the selected.
  visitSelectQuerySpecific(ctx: parser.SelectQuerySpecificContext): SelectQueryPartialIr {
    const columns = ctx.selectClause().map(s => this.visit(s) as Column);
    if (columns.length < 1) {
      // TODO
    }
    const selectBody = this.visit(ctx.selectBody()) as SelectBodyIr;
    return {
      columns,
      relations: selectBody.relations,
    };
  }

  visitSelectQueryAll(ctx: parser.SelectQueryAllContext): SelectQueryPartialIr {
    // we need to figure out what tables where referenced
    const selectBody = this.visit(ctx.selectBody()) as SelectBodyIr;
    const relations = selectBody.relations;
    // need to look up the relations
    const columns = relations.reduce((acc: Column[], r) => acc.concat(this._findRelationColumns(r)), []);
    return {
      columns,
      relations,
    };
  }

  visitSelectBody(ctx: parser.SelectBodyContext): SelectBodyIr {
    const relation = this.visit(ctx.relationReference()) as string;
    const joinsInfo = ctx.joinClause().map(j => (this.visit(j) as JoinClauseIr).relation);
    return {
      relations: [relation, ...joinsInfo]
    };
  }

  // ignore the predicates for now
  // might be useful for sanity checking later
  // as well as basic materialization
  visitJoinClause(ctx: parser.JoinClauseContext): JoinClauseIr {
    const relation = this.visit(ctx.relationReference()) as string;
    const query = getCtxSourceCode(ctx);
    return {
      relation,
      query
    };
  }

  visitRelationReferenceSimple(ctx: parser.RelationReferenceSimpleContext) {
    return ctx._relation.text;
  }

  visitColumnSelectionSimple(ctx: parser.ColumnSelectionSimpleContext) {
    // LogStandout(`visitColumnSelectionSimple ${ctx.IDENTIFIER().text}`);
    return ctx.IDENTIFIER().text;
  }

  visitColumnSelectionReference(ctx: parser.ColumnSelectionReferenceContext) {
    return ctx._column.text;
  }

  visitInputStmt = (ctx: parser.InputStmtContext): RelationIr => {
    return this.visitRelationDefintion(ctx.relationDefintion());
  }

  visitTableStmt = (ctx: parser.TableStmtContext) => {
    return this.visit(ctx.relationDefintion());
  }

  visitRelationDefintion = (ctx: parser.RelationDefintionContext): RelationIr  => {
    const columns = ctx.columnDefinition().map(e => this.visit(e) as Column);
    const name = ctx.IDENTIFIER().text;
    const r: RelationIr = {
      name,
      columns
    };
    return r;
  }

  visitColumnDefinition(ctx: parser.ColumnDefinitionContext) {
    return {
      name: ctx.IDENTIFIER().text,
      type: parseColumnType(ctx.columnType().text)
    };
  }

  // programs
  visitProgramStmtGeneral(ctx: parser.ProgramStmtGeneralContext) {
    const programs = this.visit(ctx.programBody());
    return programs;
  }

  visitProgramStmtSpecific(ctx: parser.ProgramStmtSpecificContext): ProgramsIr {
    const input = ctx.IDENTIFIER().text;
    const programs = this.visit(ctx.programBody()) as ProgramSpecIr;
    return {
      input,
      ...programs
    };
  }

  visitProgramBody(ctx: parser.ProgramBodyContext): ProgramSpecIr {
    const insertPrograms = ctx.insertQuery().map(e => (
      this.visit(e) as InsertQueryIr
    ));
    const selectPrograms = ctx.selectQuery().map(e => (
      this.visit(e) as SelectQueryIr
    ));
    return {
      selectPrograms,
      insertPrograms
    };
  }

  visitInsertQuery(ctx: parser.InsertQueryContext) {
    const relation = ctx._relation.text;
    const query = getCtxSourceCode(ctx);
    this.visit(ctx.insertBody());
    return {
      relation,
      query,
    };
  }

  // visitInsertQueryDirect(ctx: parser.InsertQueryDirectContext) {
  //   ctx.value().map(v => console.log(v.text));
  //   return "";
  // }

  // crossfilter
  visitCrossfilterStmt(ctx: parser.CrossfilterStmtContext): CrossFilterIr {
    const crossfilter = ctx._crossfilterName.text;
    const relation = ctx._relation.text;
    const charts = ctx.crossfilterChartStmt().map(c => this.visit(c) as CrossFilterChartIr);
    return {
      crossfilter,
      relation,
      charts
    };
  }

  visitCrossfilterChartStmt(ctx: parser.CrossfilterChartStmtContext): CrossFilterChartIr {
    const chartName = ctx._chart.text;
    const definition = this.visit(ctx._definitionQuery) as SelectQueryIr;
    const predicate = this.visit(ctx._predicateClause) as JoinClauseIr;
    return {
      chartName,
      definition,
      predicate
    };
  }

  _getTemplate(t: TemplateIr, values: TemplateVariableAssignments[]) {
    // basically find and replace
    let s = t.query.slice();
    t.variables.map(v => {
      const value = values.find(i => i.variable === v);
      if (!value) {
        throw new Error("Variable not found");
      }
      const re = new RegExp(v, "g");
      s = s.replace(re, value.value);
    });
    return s;
  }

  // helper
  _findRelationColumns(relation: string): Column[] {
    // find in inputs, then tables, then views, and outputs
    const rs = this.tables.concat(this.inputs).concat(this.views).concat(this.outputs);
    for (let i = 0; i < rs.length; i++) {
      if (rs[i].name === relation) {
        return rs[i].columns;
      }
    }
    return [];
  }
}