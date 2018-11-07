import { AbstractParseTreeVisitor } from "antlr4ts/tree";
import * as parser from "./grammar/DIELParser";
import * as visitor from "./grammar/DIELVisitor";

import { ExpressionValue, Column, RelationIr, DerivedRelationIr, SelectQueryIr, ProgramSpecIr, ProgramsIr, InsertQueryIr, SelectBodyIr, SelectQueryPartialIr, CrossFilterChartIr, CrossFilterIr, TemplateIr, TemplateVariableAssignments, JoinClauseIr, DielIr, ExprIr, ViewConstraintsIr, DataType, ColumnSelection, RelationReference, UdfType } from "./dielTypes";
import { parseColumnType, getCtxSourceCode } from "../compiler/helper";
import { LogInfo, LogWarning, LogTmp, ReportDielUserError } from "../lib/messages";
import { ParserInterpreter } from "antlr4ts";

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
      udfTypes: [],
      inputs: [],
      tables: [],
      outputs: [],
      views: [],
      inserts: [],
      drops: [],
      programs: [],
      crossfilters: [],
      templates: [],
    };
    this.ir.udfTypes = ctx.registerType().map(e => (
      this.visit(e) as UdfType
    ));
    // should only be called once and executed for setup.
    this.ir.templates = ctx.templateStmt().map(e => (
      this.visit(e) as TemplateIr
    ));
    this.ir.inputs = ctx.inputStmt().map(e => (
      this.visitInputStmt(e)
    ));
    this.ir.tables = ctx.tableStmt().map(e => (
      this.visit(e) as RelationIr
    ));
    this.ir.outputs = ctx.outputStmt().map(e => (
      this.visit(e) as DerivedRelationIr
    ));
    this.ir.views = ctx.viewStmt().map(e => (
      this.visit(e) as DerivedRelationIr
    ));
    this.ir.inserts = ctx.insertQuery().map(e => (
      this.visit(e) as InsertQueryIr
    ));
    this.ir.drops = ctx.dropQuery().map(e => (
      this.visit(e) as InsertQueryIr
    ));
    this.ir.programs = ctx.programStmt().map(e => (
      this.visit(e) as ProgramsIr
    ));
    this.ir.crossfilters = ctx.crossfilterStmt().map(e => (
      this.visit(e) as CrossFilterIr
    ));
    return this.ir;
  }

  visitRegisterType(ctx: parser.RegisterTypeContext): UdfType {
    const udf = ctx.IDENTIFIER().text;
    const type = parseColumnType(ctx.dataType().text);
    return {
      udf,
      type
    };
  }

  // outputs
  visitOutputStmt(ctx: parser.OutputStmtContext): DerivedRelationIr {
    const name = ctx.IDENTIFIER().text;
    const s = this.visit(ctx.selectQuery()) as SelectQueryIr;
    const constraints = this.visit(ctx.viewConstraints()) as ViewConstraintsIr;
    return {
      name,
      ...constraints,
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
    const isPublic = ctx.PUBLIC() ? true : false;
    const constraints = this.visit(ctx.viewConstraints()) as ViewConstraintsIr;
    const s = this.visit(ctx.selectQuery()) as SelectQueryIr;
    return {
      name,
      isPublic,
      ...constraints,
      ...s
    };
  }

  visitViewConstraints(ctx: parser.ViewConstraintsContext): ViewConstraintsIr {
    const isNullable = ctx.NULL() ? false : true;
    const isSingle = ctx.SINGLE() ? true : false;
    return {
      isNullable,
      isSingle
    };
  }

  visitTemplateStmt(ctx: parser.TemplateStmtContext): TemplateIr {
    const templateName = ctx._templateName.text;
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
      throw new Error(`There should be some column values in select, query is ${selectQuery}`);
    }
    const body = ctx.selectBody();
    let selectBody: SelectBodyIr = null;
    if (body) {
      selectBody = this.visit(body) as SelectBodyIr;
    }
    const query = getCtxSourceCode(ctx);
    let matchedR: RelationReference;
    // now we do the pass where we check the column types
    columns.map(c => {
      if (c.type === DataType.TBD) {
        if (c.relationName) {
          // search for the relationamte
          matchedR = selectBody.relations.filter(r => r.name === c.relationName)[0];
          if (!matchedR) {
            // Fixme: the error message could be much better here...
            // TODO: we can do some fuzzy edit distance check thing here; I've always found it nice.
            ReportDielUserError(`column ${c.name} was specified to be from ${c.relationName} in ${query}, but ${c.relationName} is not found in the source relations.`);
          }
        } else {
          // else its not from a specific relation and we need to find it...
          matchedR = selectBody.relations.filter(r => r.columns.filter(cM => cM.name === c.name).length > 0)[0];
          if (!matchedR) {
            ReportDielUserError(`column ${c.name} was specified in ${query}, but we cannot find it in any of the source relations.`);
          }
        }
        // now we can change the c.type
        const matchedC = matchedR.columns.filter(cM => c.name === cM.name)[0];
        if (!matchedC) {
          const query = getCtxSourceCode(ctx);
          // Fixme: the error message could be much better here...
          ReportDielUserError(`column ${c.name} in ${query} is not found in the source relations.`);
        }
        c.type = matchedC.type;
      }
    });
    return {
      columns,
      selectQuery,
      selectBody,
    };
  }

  visitSelectClause(ctx: parser.SelectClauseContext): Column {
    const expr = this.visit(ctx.expr()) as ExprIr;
    let type = DataType.TBD;
    let name: string;
    // temp debugging
    if (ctx.IDENTIFIER()) {
      name = ctx.IDENTIFIER().text;
      type = expr.type;
    } else {
      // if there is no name, then this is a problem
      // it's not going to have the context to give better error messages sad!!
      name = expr.name;
    }
    if (!name) {
      const query = getCtxSourceCode(ctx);
      ReportDielUserError(`Expression ${query} should be named`);
    }
    // to infer the type, we need to look up things and take a look at the function
    // basically some simple recursive datatypes??
    // we need to find expression and match it with the original query... ugh this is hard.
    // we'll get the type information in the second pass... ugh
    // can do some expression type inference
    return {
      name,
      type
    };
  }

  visitExprSimple(ctx: parser.ExprSimpleContext): ExprIr {
    return this.visit(ctx.unitExpr()) as ExprIr;
  }

  visitUnitExprColumn(ctx: parser.UnitExprColumnContext): ExprIr {
    const column = this.visit(ctx.columnSelection()) as ColumnSelection;
    return {
      ...column,
      type: DataType.TBD
    };
  }

  visitUnitExprNumber(_: parser.UnitExprNumberContext): ExprIr {
    return {
      type: DataType.Number
    };
  }

  visitUnitExprString(_: parser.UnitExprStringContext): ExprIr {
    return {
      type: DataType.String
    };
  }

  visitExprMath(_: parser.ExprMathContext): ExprIr {
    return {
      type: DataType.Number
    };
  }

  visitExprWhen(ctx: parser.ExprWhenContext): ExprIr {
    return this.visit(ctx.expr()[0]) as ExprIr;
  }

  visitExprGroupConcat(_: parser.ExprGroupConcatContext): ExprIr {
    return {
      type: DataType.String
    };
  }

  visitExprFunction(ctx: parser.ExprFunctionContext): ExprIr {
    const udf = ctx._function.text;
    const typeLookup = this.ir.udfTypes.filter(t => t.udf === udf)[0];
    if (!typeLookup) {
      const query = getCtxSourceCode(ctx);
      ReportDielUserError(`Type not defined `, query);
    }
    return {
      type: typeLookup.type
    };

  }

  visitSelectQueryAll(ctx: parser.SelectQueryAllContext): SelectQueryPartialIr {
    const selectBody = this.visit(ctx.selectBody()) as SelectBodyIr;
    const columns = selectBody.relations.reduce((acc: Column[], r) => acc.concat(r.columns), []);
    const selectQuery = "select *";
    return {
      columns,
      selectQuery,
      selectBody,
    };
  }

  visitSelectBody(ctx: parser.SelectBodyContext): SelectBodyIr {
    const fromRelation = this.visit(ctx.relationReference()) as RelationReference;
    const joinRelations = ctx.joinClause().map(j => (this.visit(j) as JoinClauseIr).relation);
    // make sure that if the fromRelation is not named, there is only one relation
    if ((!fromRelation.name) && (joinRelations.length > 0)) {
      const query = getCtxSourceCode(ctx);
      ReportDielUserError(
        `You must name the nested relation if there are more than one relation used`,
        query
      );

    }
    const joinQuery = ctx.joinClause().map(j => getCtxSourceCode(j)).join("\n");
    const whereQuery = getCtxSourceCode(ctx.whereClause());
    const groupByQuery = getCtxSourceCode(ctx.groupByClause());
    const orderByQuery = getCtxSourceCode(ctx.orderByClause());
    const limitQuery = getCtxSourceCode(ctx.limitClause());
    return {
      relations: [fromRelation, ...joinRelations],
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
    const relation = this.visit(ctx.relationReference()) as RelationReference;
    const query = getCtxSourceCode(ctx);
    if (!relation.name) {
      ReportDielUserError(`You did not specify a alias for a nested relation for this part of the query`, query);
    }
    return {
      relation,
      query
    };
  }

  visitJoinClauseCross(ctx: parser.JoinClauseCrossContext): JoinClauseIr {
    const relation = this.visit(ctx.relationReference()) as RelationReference;
    const query = getCtxSourceCode(ctx);
    return {
      relation,
      query
    };
  }

  visitJoinClauseTemplate(ctx: parser.JoinClauseTemplateContext) {
    return this.visit(ctx.templateQuery());
  }

  visitRelationReferenceSimple(ctx: parser.RelationReferenceSimpleContext): RelationReference {

    const name = ctx._relation.text;
    const columns = this._findRelationColumns(name);
    return {
      name,
      columns
    };
  }

  visitRelationReferenceSubQuery(ctx: parser.RelationReferenceSubQueryContext): RelationReference {
    const selectQuery = this.visit(ctx.selectQuery()) as SelectQueryIr;
    const name = ctx._alias ? ctx._alias.text : null;
    const q = getCtxSourceCode(ctx);
    console.log(q);
    return {
      name,
      columns: selectQuery.columns,
    };
  }

  visitColumnSelectionSimple(ctx: parser.ColumnSelectionSimpleContext): ColumnSelection {
    // LogStandout(`visitColumnSelectionSimple ${ctx.IDENTIFIER().text}`);
    return {
      name: ctx.IDENTIFIER().text
    };
  }

  visitColumnSelectionReference(ctx: parser.ColumnSelectionReferenceContext): ColumnSelection {
    return {
      name: ctx._column.text,
      relationName: ctx._relation.text,
    };
  }

  visitInputStmt = (ctx: parser.InputStmtContext): RelationIr => {
    return this.visitRelationDefintion(ctx.relationDefintion());
  }

  visitTableStmtSelect = (ctx: parser.TableStmtSelectContext): RelationIr => {
    const q = this.visit(ctx.selectQuery()) as SelectQueryIr;
    const name = ctx.IDENTIFIER().text;
    const columns = q.columns;
    const query = getCtxSourceCode(ctx);
    const isDynamic = ctx.DYNAMIC() ? true : false;
    return {
      name,
      isDynamic,
      columns,
      query
    };
  }

  visitTableStmtDirect = (ctx: parser.TableStmtDirectContext): RelationIr => {
    const isDynamic = ctx.DYNAMIC() ? true : false;
    return {
      isDynamic,
      ...this.visit(ctx.relationDefintion()) as RelationIr
    };
  }

  visitRelationDefintion = (ctx: parser.RelationDefintionContext): RelationIr  => {
    const columns = ctx.columnDefinition().map(e => this.visit(e) as Column);
    const name = ctx.IDENTIFIER().text;
    const constraints = ctx.constraintDefinition().map(c => this.visit(c) as string);
    // dummy value
    const isDynamic = false;
    return {
      name,
      columns,
      isDynamic,
      constraints
    };
  }

  visitConstraintDefinition(ctx: parser.ConstraintDefinitionContext) {
    return getCtxSourceCode(ctx);
  }

  visitColumnDefinition(ctx: parser.ColumnDefinitionContext): Column {
    const notNull = ctx.NULL() ? true : false;
    const unique =  ctx.UNIQUE() ? true : false;
    const key = ctx.KEY() ? true : false;
    return {
      name: ctx.IDENTIFIER().text,
      type: parseColumnType(ctx.dataType().text),
      constraints: {
        notNull,
        unique,
        key
      }
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
        const errMsg = `Variable ${v} not found, among ${JSON.stringify(values)}`;
        throw new Error(errMsg);
      }
      const re = new RegExp(`{${v}}`, "g");
      s = s.replace(re, value.assignment);
    });
    return s;
  }

  // helper
  _findRelationColumns(relation: string): Column[] {
    // find in inputs, then tables, then views, and outputs
    const extractFn = (t: DerivedRelationIr | RelationIr) => ({
      name: t.name,
      columns: t.columns
    });
    const rs = this.ir.tables.concat(this.ir.inputs).map(extractFn);
    const derived = this.ir.views.concat(this.ir.outputs).map(extractFn);
    const joined = rs.concat(derived);
    for (let i = 0; i < joined.length; i++) {
      if (rs[i].name === relation) {
        return rs[i].columns;
      }
    }
    return [];
  }
}