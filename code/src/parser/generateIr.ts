import { AbstractParseTreeVisitor } from "antlr4ts/tree";
import * as parser from "./grammar/DIELParser";
import * as visitor from "./grammar/DIELVisitor";

import { ExpressionValue, Column, DynamicRelationIr, DerivedRelationIr, SelectQueryIr, ProgramSpecIr, ProgramsIr, InsertQueryIr, SelectBodyIr, SelectQueryPartialIr, CrossFilterChartIr, CrossFilterIr, JoinClauseIr, DielAst, ExprIr, ViewConstraintsIr, DataType, ColumnSelection, RelationReference, UdfType, BuiltInUdfTypes, StaticRelationIr, DielRemoteType, PartialDynamicRelationIr, BuiltInColumns, DielContext, DielSummary } from "./dielAstTypes";
import { parseColumnType, getCtxSourceCode } from "../compiler/helper";
import { LogInfo, LogWarning, LogTmp, ReportDielUserError } from "../lib/messages";
import { findType, findRelationColumns } from "./visitorHelper";
import { checkIsInput } from "./parseTimeErrorChecking";

export default class Visitor extends AbstractParseTreeVisitor<ExpressionValue>
implements visitor.DIELVisitor<ExpressionValue> {
  private ir: DielAst;
  private dielSummary: DielSummary;
  private context: DielContext;

  defaultResult() {
    LogWarning("All the visits should be handled");
    return "";
  }

  // this is useful for compiling partial queries
  setContext(ir: DielAst) {
    LogInfo("setting context");
    this.ir = ir;
  }

  visitQueries = (ctx: parser.QueriesContext): DielAst => {
    this.context = null;
    this.ir = {
      udfTypes: [],
      inputs: [],
      dynamicTables: [],
      staticTables: [],
      outputs: [],
      views: [],
      inserts: [],
      drops: [],
      programs: [],
      crossfilters: [],
    };
    this.ir.udfTypes = ctx.registerTypeUdf().map(e => (
      this.visit(e) as UdfType
    )).concat(BuiltInUdfTypes);
    // two kinds of specifications
    this.ir.staticTables = ctx.registerTypeTable().map(e => (
      this.visit(e) as StaticRelationIr
    )).concat(ctx.registerTypeTable().map(e => (
      this.visit(e) as StaticRelationIr
    )));
    this.ir.inputs = ctx.inputStmt().map(e => (
      this.visitInputStmt(e)
    ));
    this.ir.dynamicTables = ctx.dynamicTableStmt().map(e => (
      this.visit(e) as DynamicRelationIr
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

  visitRegisterTypeUdf(ctx: parser.RegisterTypeUdfContext): UdfType {
    const udf = ctx.IDENTIFIER().text;
    const type = parseColumnType(ctx.dataType().text);
    return {
      udf,
      type
    };
  }

  visitRegisterTypeTable(ctx: parser.RegisterTypeTableContext): StaticRelationIr {
    const name = ctx._tableName.text;
    const columns = ctx.columnDefinition().map(e => this.visit(e) as Column);
    const remoteType = ctx.WEBWORKER() ? DielRemoteType.WebWorker : DielRemoteType.Server;
    return {
      name,
      columns,
      remoteType
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

  visitSelectUnitQueryAll(ctx: parser.SelectUnitQueryAllContext): SelectQueryPartialIr {
    const selectBody = this.visit(ctx.selectBody()) as SelectBodyIr;
    const columns = selectBody.relations.reduce((acc: Column[], r) => acc.concat(r.columns), []);
    const selectQuery = "select *";
    return {
      columns,
      selectQuery,
      selectBody,
    };
  }

  // TODO: do some type checking/inference on the selected.
  visitSelectUnitQuerySpecific(ctx: parser.SelectUnitQuerySpecificContext): SelectQueryPartialIr {
    const columns = ctx.selectClause().map(s => this.visit(s) as Column);
    const selectQuery = ctx.selectClause().map(s => getCtxSourceCode(s)).join(", ");
    if (columns.length < 1) {
      // TODO
      throw new Error(`There should be some column values in select, query is ${selectQuery}`);
    }
    const body = ctx.selectBody();
    const selectBody = body ? this.visit(body) as SelectBodyIr : null;
    // now we do the pass where we check the column types
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
      relationName: expr.relationName,
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

  visitExprFunction(ctx: parser.ExprFunctionContext): ExprIr {
    const udf = ctx._function.text;
    // think about a more elegant comparison
    const typeLookup = this.ir.udfTypes.filter(t => t.udf.toLowerCase() === udf.toLowerCase())[0];
    if (!typeLookup) {
      const query = getCtxSourceCode(ctx);
      ReportDielUserError(`Type not defined `, query);
    }
    return {
      type: typeLookup.type
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
    // check if the name is a relation
    const alias = ctx._alias ? ctx._alias.text : name;
    const columns = findRelationColumns(name, this.ir);
    return {
      name,
      alias,
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
      alias: name,
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

  visitInputStmt(ctx: parser.InputStmtContext): DynamicRelationIr {
    const name = ctx.IDENTIFIER().text;
    return {
      name,
      ...this.visit(ctx.relationDefintion()) as PartialDynamicRelationIr
    };
  }

  visitStaticTableStmtDefined(ctx: parser.StaticTableStmtDefinedContext): StaticRelationIr {
    // it would not be the case of server here.
    const remoteType = ctx.WEBWORKER() ? DielRemoteType.WebWorker : DielRemoteType.Local;
    const name = ctx.IDENTIFIER().text;
    return {
      name,
      remoteType,
      ...this.visit(ctx.relationDefintion()) as PartialDynamicRelationIr
    };
  }

  visitStaticTableStmtSelect(ctx: parser.StaticTableStmtSelectContext): StaticRelationIr {
    const q = this.visit(ctx.selectQuery()) as SelectQueryIr;
    const name = ctx.IDENTIFIER().text;
    const columns = q.columns;
    const query = getCtxSourceCode(ctx);
    const remoteType = DielRemoteType.Local;
    return {
      name,
      columns,
      remoteType,
      query
    };
  }

  visitDynamicTableStmt = (ctx: parser.DynamicTableStmtContext): DynamicRelationIr => {
    return {
      ...this.visit(ctx.relationDefintion()) as DynamicRelationIr
    };
  }

  visitRelationDefintionSimple = (ctx: parser.RelationDefintionSimpleContext): PartialDynamicRelationIr  => {
    const columns = ctx.columnDefinition().map(e => this.visit(e) as Column);
    const constraints = ctx.constraintDefinition().map(c => this.visit(c) as string);
    return {
      columns,
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
    // set the context
    this.context = {program : {isGeneral: true}};
    return programs;
  }

  visitProgramStmtSpecific(ctx: parser.ProgramStmtSpecificContext): ProgramsIr {
    const input = ctx.IDENTIFIER().text;
    // TODO: check that this is actually an input
    checkIsInput(input, this.ir);
    this.context = {program : {isGeneral: false, name: input}};
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

  // helpers
}