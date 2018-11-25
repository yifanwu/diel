import { AbstractParseTreeVisitor } from "antlr4ts/tree";
import * as parser from "./grammar/DIELParser";
import * as visitor from "./grammar/DIELVisitor";

import { ExpressionValue, DerivedRelation, ProgramSpec, ProgramsIr, CrossFilterChartIr, CrossFilterIr, DielAst, ViewConstraints, DataType, UdfType, BuiltInUdfTypes, ExistingRelation, DynamicRelation, StaticRelationType, RelationConstraints, DerivedRelationType } from "../dielAstTypes";
import { parseColumnType, getCtxSourceCode } from "../compiler/helper";
import { LogInfo, LogWarning, ReportDielUserError } from "../lib/messages";
import { checkIsInput } from "./parseTimeErrorChecking";
import { InsertionClause, Drop, Column, RelationReference, RelationSelection, CompositeSelectionUnit, ColumnSelection, SetOperator, SelectionUnit, JoinAst, OrderByAst } from "../sqlAstTypes";
import { ExprAst } from "../exprAstTypes";

export default class Visitor extends AbstractParseTreeVisitor<ExpressionValue>
implements visitor.DIELVisitor<ExpressionValue> {
  private ir: DielAst;

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
    const selections = ctx.selectClause().map(s => this.visit(s) as ColumnSelection);
    if (selections.length < 1) {
      const selectQuery = ctx.selectClause().map(s => getCtxSourceCode(s)).join(", ");
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

  visitExprSimple(ctx: parser.ExprSimpleContext): ExprAst {
    return this.visit(ctx.unitExpr()) as ExprAst;
  }

  visitUnitExprColumn(ctx: parser.UnitExprColumnContext): ExprAst {
    const column = this.visit(ctx.columnSelection()) as ColumnSelection;
    return {
      ...column,
      type: DataType.TBD
    };
  }

  visitUnitExprNumber(ctx: parser.UnitExprNumberContext): ExprBaseAst {
    return {
      type: DataType.Number,
      value: 
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