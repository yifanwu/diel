import { AbstractParseTreeVisitor } from "antlr4ts/tree";
import * as parser from "./grammar/DIELParser";
import * as visitor from "./grammar/DIELVisitor";

import { ExpressionValue, DerivedRelation, ProgramSpec, ProgramsIr, CrossFilterChartIr, CrossFilterIr, DielAst, DataType, UdfType, BuiltInUdfTypes, ExistingRelation, DynamicRelation, StaticRelationType, RelationConstraints, DerivedRelationType, DielTemplate, DynamicRelationType } from "../dielAstTypes";
import { parseColumnType, getCtxSourceCode } from "../compiler/helper";
import { LogInfo, LogWarning } from "../lib/messages";
import { checkIsInput } from "./parseTimeErrorChecking";
import { InsertionClause, Drop, Column, RelationReference, RelationSelection, CompositeSelectionUnit, ColumnSelection, SetOperator, SelectionUnit, JoinAst, OrderByAst, JoinType, ColumnConstraints, rawValues } from "../sqlAstTypes";
import { ExprAst, ExprValAst, ExprFunAst, FunctionType, BuiltInFunc, ExprColumnAst } from "../exprAstTypes";
import { notNull } from "antlr4ts/misc";

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
      functionReference: func,
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
    const columns = this.visit(ctx.relationDefintion()) as Column[];
    return {
      name,
      relationType,
      columns
    };
  }

  visitStaticTableStmt(ctx: parser.StaticTableStmtContext): DerivedRelation {
    // it would not be the case of server here.
    const name = ctx.IDENTIFIER().text;
    const relationType = DerivedRelationType.StaticTable;
    const selection = this.visit(ctx.selectQuery()) as RelationSelection;
    return {
      name,
      relationType,
      selection
    };
  }

  visitDynamicTableStmt = (ctx: parser.DynamicTableStmtContext): DynamicRelation => {
    const name = ctx.IDENTIFIER().text;
    const relationType = DynamicRelationType.DynamicTable;
    const columns = this.visit(ctx.relationDefintion()) as Column[];
    return {
      name,
      relationType,
      columns
    };
  }

  visitRelationDefintion = (ctx: parser.RelationDefintionContext): Column[]  => {
    const columns = ctx.columnDefinition().map(e => this.visit(e) as Column);
    return columns;
  }

  visitConstraintClause(ctx: parser.ConstraintClauseContext): RelationConstraints {
    let primaryKeys: string[] = [];
    let uniques: string[][] = [];
    let exprChecks: ExprAst[] = [];
    let notNull: string[] = [];
    let constraints = {
      relationNotNull: false,
      relationHasOneRow: false,
      primaryKeys,
      uniques,
      exprChecks,
    };
    ctx.constraintDefinition().map(e => {
      if (e.KEY()) {
        primaryKeys = e.IDENTIFIER().map(i => i.text);
      } else if (e.UNIQUE()) {
        const aUnique = e.IDENTIFIER().map(i => i.text);
        uniques.push(aUnique);
      } else if (e.NULL()) {
        notNull.push(e.IDENTIFIER()[0].text);
      } else if (e.CHECK()) {
        exprChecks.push(this.visit(e.expr()));
      }
    });
    return constraints;
  }

  visitColumnDefinition(ctx: parser.ColumnDefinitionContext): Column {
    let constraints = {
      notNull: false,
      unique: false,
      key: false
    };
    ctx.columnConstraints().map(e => {
      if (e.UNIQUE()) {
        constraints.unique = true;
      } else if (e.KEY()) {
        constraints.key = true;
      } else if (e.NULL()) {
        constraints.notNull = true;
      }
    });
    return {
      name: ctx.IDENTIFIER().text,
      type: parseColumnType(ctx.dataType().text),
      constraints
    };
  }

  // programs
  visitProgramStmtGeneral(ctx: parser.ProgramStmtGeneralContext) {
    const programs = this.visit(ctx.programBody());
    return programs;
  }

  visitProgramStmtSpecific(ctx: parser.ProgramStmtSpecificContext): ProgramsIr {
    const input = ctx.IDENTIFIER().text;
    const programs = this.visit(ctx.programBody()) as ProgramSpec;
    return {
      input,
      ...programs
    };
  }

  visitProgramBody(ctx: parser.ProgramBodyContext): ProgramSpec {
    const insertPrograms = ctx.insertQuery().map(e => (
      this.visit(e) as InsertionClause
    ));
    const selectPrograms = ctx.selectQuery().map(e => (
      this.visit(e) as RelationSelection
    ));
    return {
      selectPrograms,
      insertPrograms
    };
  }

  visitInsertQuery(ctx: parser.InsertQueryContext): InsertionClause {
    const identifiers = ctx.IDENTIFIER().map(e => e.text);
    const relation = identifiers[0];
    const columns = identifiers.slice(1);
    const v = this.visit(ctx.insertBody());
    let selection;
    let values;
    if ("op" in v[0]) {
      selection = v as RelationSelection;
    } else {
      values = v as rawValues;
    }
    return {
      relation,
      columns,
      selection,
      values
    };
  }

  visitInsertBodyDirect(ctx: parser.InsertBodyDirectContext): rawValues {
    return ctx.value().map(e => {
      const t = this.visit(e) as ExprValAst;
      return t.value;
    });
  }

  visitInsertBodySelect(ctx: parser.InsertBodySelectContext): RelationSelection {
    return this.visit(ctx.selectUnitQuery());
  }

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
    const selection = this.visit(ctx._definitionQuery) as RelationSelection;
    const predicate = this.visit(ctx._predicateClause) as JoinAst;
    return {
      chartName,
      selection,
      predicate
    };
  }
}