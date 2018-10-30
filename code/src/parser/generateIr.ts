import { AbstractParseTreeVisitor } from "antlr4ts/tree";
import * as parser from "./grammar/DIELParser";
import * as visitor from "./grammar/DIELVisitor";

import { ExpressionValue, Column, RelationIr, DerivedRelationIr, SelectQueryIr, ProgramSpecIr, ProgramsIr, InsertQueryIr, SelectBodyIr, SelectQueryPartialIr, CrossFilterChartIr, CrossFilterIr, TemplateIr, TemplateVariableAssignments, JoinClauseIr, DielIr, ExprIr } from "./dielTypes";
import { parseColumnType, getCtxSourceCode } from "../compiler/helper";
import { LogInfo, LogWarning, LogTmp } from "../util/messages";

export default class Visitor extends AbstractParseTreeVisitor<ExpressionValue>
implements visitor.DIELVisitor<ExpressionValue> {
  private ir: DielIr;

  defaultResult() {
    LogWarning("All the visits should be handled");
    return "";
  }

  // this is useful for compiling partial queries
  setContext(ir: DielIr) {
    LogInfo("setting context");
    this.ir = ir;
  }

  visitQueries = (ctx: parser.QueriesContext): DielIr => {
    this.ir = {
      inputs: null,
      tables: null,
      outputs: null,
      views: null,
      inserts: null,
      drops: null,
      programs: null,
      crossfilters: null,
      templates: null,
    };
    // should only be called once and executed for setup.
    const templates: TemplateIr[] = ctx.templateStmt().map(e => (
      this.visit(e) as TemplateIr
    ));
    this.ir.templates = templates;
    const inputs: RelationIr[] = ctx.inputStmt().map(e => (
      this.visitInputStmt(e)
    ));
    this.ir.inputs = inputs;
    const tables: RelationIr[] = ctx.tableStmt().map(e => (
      this.visit(e) as RelationIr
    ));
    this.ir.tables = tables;
    const outputs: DerivedRelationIr[] = ctx.outputStmt().map(e => (
      this.visit(e) as DerivedRelationIr
    ));
    const views: DerivedRelationIr[] = ctx.viewStmt().map(e => (
      this.visit(e) as DerivedRelationIr
    ));
    const inserts: InsertQueryIr[] = ctx.insertQuery().map(e => (
      this.visit(e) as InsertQueryIr
    ));
    const drops: InsertQueryIr[] = ctx.dropQuery().map(e => (
      this.visit(e) as InsertQueryIr
    ));
    const programs: ProgramsIr[] = ctx.programStmt().map(e => (
      this.visit(e) as ProgramsIr
    ));
    const crossfilters: CrossFilterIr[] = ctx.crossfilterStmt().map(e => (
      this.visit(e) as CrossFilterIr
    ));
    return {
      inputs,
      tables,
      outputs,
      views,
      inserts,
      drops,
      programs,
      crossfilters,
      templates,
    };
  }

  // visitConfigStmt(ctx: parser.ConfigStmtContext) {
  //   let config: any = {};
  //   ctx.configUnit().map(c => {
  //     const unitConfig = this.visit(c);
  //     config[unitConfig.key] = unitConfig.value;
  //   });
  //   return config;
  // }
  // visitConfigUnitName(ctx: parser.ConfigUnitNameContext) {
  //   return {
  //     key: "name",
  //     value: ctx.STRING().text,
  //   };
  // }
  // visitConfigUnitLogging(ctx: parser.ConfigUnitLoggingContext) {
  //   return {
  //     key: "logging",
  //     value: ctx.STRING().text,
  //   };
  // }
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

  visitDropQuery(ctx: parser.DropQueryContext): InsertQueryIr {
    const relation = ctx.IDENTIFIER().text;
    const query = getCtxSourceCode(ctx);
    return {
      relation,
      query
    };
  }

  // This is for using the template
  visitTemplateQuery(ctx: parser.TemplateQueryContext) {
    const values = ctx.variableAssignment().map(v => this.visit(v) as TemplateVariableAssignments);
    const templateName = ctx._templateName.text;
    LogTmp(`Processed template ${templateName}`);
    const t = this.ir.templates.find(i => i.templateName === templateName);
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
    console.log("visiting", templateName);
    // make sure that this is expected
    const variables = ctx.IDENTIFIER().map(i => i.text).splice(1);
    let query;
    if (ctx.selectQuery()) {
      query = this.visit(ctx.selectQuery()) as SelectQueryIr;
    } else {
      query = this.visit(ctx.joinClause()) as JoinClauseIr;
    }
    return {
      templateName,
      variables,
      query: query.query,
    };
  }

  visitVariableAssignment(ctx: parser.VariableAssignmentContext): TemplateVariableAssignments {
    // need to get rid of the quotes
    const str = ctx._assignment.text;
    return {
      variable: ctx._variable.text,
      assignment: str.slice(1, str.length - 1)
    };
  }

  // TODO: do some type checking/inference on the selected.
  visitSelectQuerySpecific(ctx: parser.SelectQuerySpecificContext): SelectQueryPartialIr {
    const columns = ctx.selectClause().map(s => this.visit(s) as Column);
    const selectQuery = ctx.selectClause().map(s => getCtxSourceCode(s)).join(", ");
    if (columns.length < 1) {
      // TODO
    }
    const body = ctx.selectBody();
    let selectBody = null;
    if (body) {
      selectBody = this.visit(body) as SelectBodyIr;
    }
    return {
      columns,
      selectQuery,
      selectBody,
    };
  }

  visitSelectClause(ctx: parser.SelectClauseContext) {
    let name: string;
    if (ctx.IDENTIFIER()) {
      name = ctx.IDENTIFIER().text;
    } else {
      const expr = this.visit(ctx.expr()) as ExprIr;
      // if there is no name, then this is a problem
      // it's not going to have the context to give better error messages sad!!
      if (expr.name === undefined) {
        throw new Error(`Expression not named`);
      }
    }
    return name;
  }

  visitExprSimple(ctx: parser.ExprSimpleContext): ExprIr {
    return {
      name: this.visit(ctx.unitExpr()) as string
    };
  }

  visitUnitExprColumn(ctx: parser.UnitExprColumnContext) {
    return this.visit(ctx.columnSelection());
  }

  visitSelectQueryAll(ctx: parser.SelectQueryAllContext): SelectQueryPartialIr {
    // we need to figure out what tables where referenced
    const selectBody = this.visit(ctx.selectBody()) as SelectBodyIr;
    const relations = selectBody.joinRelations.concat(selectBody.fromRelation);
    // need to look up the relations
    const columns = relations.reduce((acc: Column[], r) => acc.concat(this._findRelationColumns(r)), []);
    const selectQuery = "select *";
    return {
      columns,
      selectQuery,
      selectBody,
    };
  }

  visitSelectBody(ctx: parser.SelectBodyContext): SelectBodyIr {
    const fromRelation = this.visit(ctx.relationReference()) as string;
    const joinRelations = ctx.joinClause().map(j => (this.visit(j) as JoinClauseIr).relation);
    const joinQuery = ctx.joinClause().map(j => getCtxSourceCode(j)).join("\n");
    const whereQuery = getCtxSourceCode(ctx.whereClause());
    const groupByQuery = getCtxSourceCode(ctx.groupByClause());
    const orderByQuery = getCtxSourceCode(ctx.orderByClause());
    const limitQuery = getCtxSourceCode(ctx.limitClause());
    return {
      fromRelation,
      joinRelations,
      joinQuery,
      whereQuery,
      groupByQuery,
      orderByQuery,
      limitQuery,
    };
  }

  // ignore the predicates for now
  // might be useful for sanity checking later
  // as well as basic materialization
  visitJoinClauseBasic(ctx: parser.JoinClauseBasicContext): JoinClauseIr {
    const relation = this.visit(ctx.relationReference()) as string;
    const query = getCtxSourceCode(ctx);
    return {
      relation,
      query
    };
  }
  visitJoinClauseCross(ctx: parser.JoinClauseCrossContext): JoinClauseIr {
    const relation = this.visit(ctx.relationReference()) as string;
    const query = getCtxSourceCode(ctx);
    return {
      relation,
      query
    };
  }

  visitJoinClauseTemplate(ctx: parser.JoinClauseTemplateContext) {
    return this.visit(ctx.templateQuery());
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

  visitTableStmtSelect = (ctx: parser.TableStmtSelectContext): RelationIr => {
    const q = this.visit(ctx.selectQuery()) as SelectQueryIr;
    const name = ctx.IDENTIFIER().text;
    const columns = q.columns;
    const query = getCtxSourceCode(ctx);
    const isStatic = ctx.STATIC() ? true : false;
    return {
      name,
      isStatic,
      columns,
      query
    };
  }

  visitTableStmtDirect = (ctx: parser.TableStmtDirectContext): RelationIr => {
    const isStatic = ctx.STATIC() ? true : false;
    return {
      isStatic,
      ...this.visit(ctx.relationDefintion()) as RelationIr
    };
  }

  visitRelationDefintion = (ctx: parser.RelationDefintionContext): RelationIr  => {
    const columns = ctx.columnDefinition().map(e => this.visit(e) as Column);
    const name = ctx.IDENTIFIER().text;
    const constraints = ctx.constraintDefinition().map(c => this.visit(c) as string);
    return {
      name,
      columns,
      constraints
    };
  }

  visitConstraintDefinition(ctx: parser.ConstraintDefinitionContext) {
    return getCtxSourceCode(ctx);
  }

  visitColumnDefinition(ctx: parser.ColumnDefinitionContext) {
    const notNull = ctx.NULL() ? true : false;
    const unique =  ctx.UNIQUE() ? true : false;
    const key = ctx.KEY() ? true : false;
    return {
      name: ctx.IDENTIFIER().text,
      type: parseColumnType(ctx.columnType().text),
      notNull,
      unique,
      key
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
    console.log("visitng crossfilter", crossfilter);
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
        const errMsg = `Variable ${v} not found, among ${JSON.stringify(values)}`;
        throw new Error(errMsg);
      }
      const re = new RegExp(`{${v}}`, "g");
      console.log("replacing", s, "with", value.assignment);
      s = s.replace(re, value.assignment);
      console.log("to", s);
    });
    return s;
  }

  // helper
  _findRelationColumns(relation: string): Column[] {
    // find in inputs, then tables, then views, and outputs
    const rs = this.ir.tables.concat(this.ir.inputs).concat(this.ir.views).concat(this.ir.outputs);
    for (let i = 0; i < rs.length; i++) {
      if (rs[i].name === relation) {
        return rs[i].columns;
      }
    }
    return [];
  }
}