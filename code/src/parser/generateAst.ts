import { AbstractParseTreeVisitor } from "antlr4ts/tree";
import * as parser from "./grammar/DIELParser";
import * as visitor from "./grammar/DIELVisitor";

import { ExpressionValue, DerivedRelation, ProgramSpec, ProgramsIr, CrossFilterChartIr, CrossFilterIr, DielAst, ViewConstraints, DataType, UdfType, BuiltInUdfTypes, ExistingRelation, DynamicRelation, StaticRelationType, RelationConstraints, DerivedRelationType, DielTemplate, DynamicRelationType } from "../dielAstTypes";
import { parseColumnType, getCtxSourceCode } from "../compiler/helper";
import { LogInfo, LogWarning } from "../lib/messages";
import { checkIsInput } from "./parseTimeErrorChecking";
import { InsertionClause, Drop, Column, RelationReference, RelationSelection, CompositeSelectionUnit, ColumnSelection, SetOperator, SelectionUnit, JoinAst, OrderByAst, JoinType } from "../sqlAstTypes";
import { ExprAst, ExprValAst, ExprFunAst, FunctionType, BuiltInFunc, ExprColumnAst } from "../exprAstTypes";

export default class Visitor extends AbstractParseTreeVisitor<ExpressionValue>
implements visitor.DIELVisitor<ExpressionValue> {
  private ir: DielAst;
  // private templates: Map<string, DielTemplate>;

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
      this.visit(e) as ExistingRelation
    )).concat(ctx.registerTypeTable().map(e => (
      this.visit(e) as ExistingRelation
    )));
    this.ir.inputs = ctx.inputStmt().map(e => (
      this.visitInputStmt(e)
    ));
    this.ir.dynamicTables = ctx.dynamicTableStmt().map(e => (
      this.visit(e) as DynamicRelation
    ));
    this.ir.outputs = ctx.outputStmt().map(e => (
      this.visit(e) as DerivedRelation
    ));
    this.ir.views = ctx.viewStmt().map(e => (
      this.visit(e) as DerivedRelation
    ));
    this.ir.inserts = ctx.insertQuery().map(e => (
      this.visit(e) as InsertionClause
    ));
    this.ir.drops = ctx.dropQuery().map(e => (
      this.visit(e) as Drop
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

  visitRegisterTypeTable(ctx: parser.RegisterTypeTableContext): ExistingRelation {
    const name = ctx._tableName.text;
    const columns = ctx.columnDefinition().map(e => this.visit(e) as Column);
    const relationType = ctx.WEBWORKER() ? StaticRelationType.WebWorker : StaticRelationType.Server;
    return {
      name,
      columns,
      relationType,
    };
  }

  // outputs
  visitOutputStmt(ctx: parser.OutputStmtContext): DerivedRelation {
    const name = ctx.IDENTIFIER().text;
    const selection = this.visit(ctx.selectQuery()) as RelationSelection;
    const constraints = this.visit(ctx.constraintClause()) as RelationConstraints;
    return {
      name,
      relationType: DerivedRelationType.Output,
      constraints,
      selection
    };
  }

  visitSelectQueryDirect(ctx: parser.SelectQueryDirectContext): RelationSelection {
    // this is lazy, assume union or intersection to a hve the same columns
    const firstQuery = this.visit(ctx.selectUnitQuery()) as SelectionUnit;
    const compositeSelections = ctx.compositeSelect().map(e => this.visit(e) as CompositeSelectionUnit);
    return [{op: SetOperator.UNION, relation: firstQuery}, ...compositeSelections];
  }

  visitDropQuery(ctx: parser.DropQueryContext): Drop {
    const relationName = ctx.IDENTIFIER().text;
    return {
      relationName
    };
  }


  visitViewStmt(ctx: parser.ViewStmtContext): DerivedRelation {
    const name = ctx.IDENTIFIER().text;
    const relationType = ctx.PUBLIC() ? DerivedRelationType.PublicView : DerivedRelationType.PrivateView;
    const constraints = this.visit(ctx.constraintClause()) as RelationConstraints;
    const selection = this.visit(ctx.selectQuery()) as RelationSelection;
    return {
      name,
      relationType,
      constraints,
      selection
    };
  }

  visitViewConstraints(ctx: parser.ViewConstraintsContext): ViewConstraints {
    const isNullable = ctx.NULL() ? false : true;
    const isSingle = ctx.SINGLE() ? true : false;
    return {
      isNullable,
      isSingle
    };
  }

  // TODO: do some type checking/inference on the selected.
  visitSelectUnitQuery(ctx: parser.SelectUnitQueryContext): SelectionUnit {
    const selections = ctx.selectColumnClause().map(s => this.visit(s) as ColumnSelection);
    if (selections.length < 1) {
      const selectQuery = ctx.selectColumnClause().map(s => getCtxSourceCode(s)).join(", ");
      throw new Error(`There should be some column values in select, query is ${selectQuery}`);
    }
    let body = null;
    if (ctx.FROM()) {
      const baseRelation = this.visit(ctx.relationReference()) as RelationReference;
      const joinClauses = ctx.joinClause().map(e => this.visit(e) as JoinAst);
      const whereClause = this.visit(ctx.whereClause()) as ExprAst;
      const groupByClause = this.visit(ctx.groupByClause()) as ColumnSelection[];
      const orderByClause = this.visit(ctx.orderByClause()) as OrderByAst[];
      const limitClause = this.visit(ctx.limitClause()) as ExprAst;
      body = {
        baseRelation,
        joinClauses,
        whereClause,
        groupByClause,
        orderByClause,
        limitClause
      };
    }
    return {
      selections,
      ...body,
    };
  }

  visitSelectClauseSpecific(ctx: parser.SelectClauseSpecificContext): ColumnSelection {
    const expr = this.visit(ctx.expr()) as ExprAst;
    return {
      hasStar: false,
      expr
    };
  }

  visitSelectClauseAll(ctx: parser.SelectClauseAllContext): ColumnSelection {
    const hasStar = true;
    const relationName = ctx.IDENTIFIER().text;
    return {
      hasStar,
      relationName
    };
  }

  // begin level exprSimple
  visitExprSimple(ctx: parser.ExprSimpleContext): ExprAst {
    return this.visit(ctx.unitExpr()) as ExprAst;
  }

  visitUnitExprColumn(ctx: parser.UnitExprColumnContext): ExprColumnAst {
    const hasStar = ctx.STAR() ? true : false;
    const columnName = ctx._column ? ctx._column.text : undefined;
    const relationName = ctx._relation ? ctx._relation.text : undefined;
    const column = {
      hasStar,
      columnName,
      relationName
    };
    return {
      column,
      dataType: DataType.TBD
    };
  }

  visitUnitExprValue(ctx: parser.UnitExprValueContext): ExprValAst {
    return this.visit(ctx.value()) as ExprValAst;
  }

  visitValueNumber(ctx: parser.ValueNumberContext): ExprValAst {
    return {
      dataType: DataType.Number,
      value: Number(ctx.NUMBER().text)
    };
  }

  visitValueString(ctx: parser.ValueStringContext): ExprValAst {
    return {
      dataType: DataType.String,
      value: ctx.STRING().text
    };
  }

  // begin paren
  visitExprParenthesis(ctx: parser.ExprParenthesisContext): ExprAst {
    return this.visit(ctx.expr()) as ExprAst;
  }

  // begin
  visitExprConcat(ctx: parser.ExprConcatContext): ExprAst {
    const args = ctx.expr().map(e => this.visit(e) as ExprAst);
    return {
      dataType: DataType.String,
      functionType: FunctionType.BuiltIn,
      functionReference: BuiltInFunc.ConcatStrings,
      args
    };
  }

  visitExprFunction(ctx: parser.ExprFunctionContext): ExprFunAst {
    const functionReference = ctx._function.text;
    const args = ctx.expr().map(e => this.visit(e) as ExprAst);
    // think about a more elegant comparison
    return {
      dataType: DataType.TBD,
      functionType: FunctionType.Custom,
      functionReference,
      args
    };
  }

  // begin level
  visitExprBinOp(ctx: parser.ExprBinOpContext): ExprFunAst {
    let functionType = FunctionType.Logic;
    let functionReference;
    let dataType = DataType.Boolean;
    if (ctx.mathOp()) {
      functionType = FunctionType.Math;
      functionReference = getCtxSourceCode(ctx.mathOp());
      dataType = DataType.Number;
    } else if (ctx.compareOp()) {
      FunctionType.Compare;
      functionReference = getCtxSourceCode(ctx.compareOp());
    } else {
      functionReference = getCtxSourceCode(ctx.logicOp());
    }
    const args = ctx.expr().map(e => this.visit(e) as ExprAst);
    return {
      functionType,
      functionReference,
      dataType,
      args
    };
  }

  // begin
  visitExprNull(ctx: parser.ExprNullContext): ExprFunAst {
    const functionReference = ctx.NOT() ? BuiltInFunc.ValueIsNotNull : BuiltInFunc.ValueIsNull;
    const arg = this.visit(ctx.expr()) as ExprAst;
    return {
      dataType: DataType.Boolean,
      functionType: FunctionType.BuiltIn,
      functionReference,
      args: [arg]
    };
  }

  visitExprExist(ctx: parser.ExprExistContext): ExprFunAst {
    const functionReference = ctx.NOT() ? BuiltInFunc.SetNotEmpty : BuiltInFunc.SetEmpty;
    const arg = this.visit(ctx.expr()) as ExprAst;
    return {
      dataType: DataType.Boolean,
      functionType: FunctionType.BuiltIn,
      functionReference,
      args: [arg]
    };
  }

  visitExprWhen(ctx: parser.ExprWhenContext): ExprFunAst {
    const func = BuiltInFunc.IfThisThen;
    const args = ctx.expr().map(e => this.visit(e) as ExprAst);
    return {
      dataType: DataType.TBD,
      functionType: FunctionType.BuiltIn,
      functionReference: BuiltInFuncReference.get(func),
      args
    };
  }

  visitJoinClauseBasic(ctx: parser.JoinClauseBasicContext): JoinAst {
    const relation = this.visit(ctx.relationReference()) as RelationReference;
    const predicate = this.visit(ctx.expr()) as ExprAst;
    const joinType = ctx.LEFT()
      ? JoinType.LeftOuter
      : ctx.JOIN()
        ? JoinType.Inner
        : JoinType.CROSS;
    return {
      joinType,
      relation,
      predicate
    };
  }

  // template basically saves the AST and the AST gets parsed again when evaluated here
  // visitTemplateStmt(ctx: parser.TemplateStmtContext) {
  //   // not going to return anything, modify global
  // }

  visitJoinClauseTemplate(ctx: parser.JoinClauseTemplateContext) {
    // return this.visit(ctx.templateQuery());
    throw new Error("Template not yet implemented");
    return "";
  }

  visitRelationReferenceSimple(ctx: parser.RelationReferenceSimpleContext): RelationReference {
    const relationName = ctx._relation.text;
    // check if the name is a relation
    const alias = ctx._alias ? ctx._alias.text : name;
    return {
      alias,
      relationName
    };

  // relationName: string;
  // alias?: string;
  // subquery?: RelationSelection;
  }

  visitRelationReferenceSubQuery(ctx: parser.RelationReferenceSubQueryContext): RelationReference {
    const subquery = this.visit(ctx.selectQuery()) as RelationSelection;
    const alias = ctx._alias ? ctx._alias.text : null;
    const q = getCtxSourceCode(ctx);
    console.log(q);
    return {
      alias,
      subquery
    };
  }

  visitInputStmt(ctx: parser.InputStmtContext): DynamicRelation {
    const relationType = DynamicRelationType.Input;
    const name = ctx.IDENTIFIER().text;
    return {
      name,
      relationType
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
    const programs = this.visit(ctx.programBody()) as ProgramSpec;
    return {
      input,
      ...programs
    };
  }

  visitProgramBody(ctx: parser.ProgramBodyContext): ProgramSpec {
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
      denormalizedRelation,
      predicate
    };
  }

  // helpers
}