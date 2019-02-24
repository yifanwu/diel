import { AbstractParseTreeVisitor } from "antlr4ts/tree";
import * as parser from "./grammar/DIELParser";
import * as visitor from "./grammar/DIELVisitor";

import { ExpressionValue, DerivedRelation, ProgramSpec, ProgramsIr, CrossFilterChartIr, CrossFilterIr, DielAst, DataType, UdfType, BuiltInUdfTypes, OriginalRelation, RelationConstraints, DerivedRelationType, OriginalRelationType, DielTemplate, ForeignKey, ProgramsParserIr } from "./dielAstTypes";
import { parseColumnType, getCtxSourceCode } from "./visitorHelper";
import { LogInfo, LogInternalError, ReportDielUserError } from "../lib/messages";
import { InsertionClause, Drop, Column, RelationReference, RelationSelection, CompositeSelectionUnit, ColumnSelection, SetOperator, SelectionUnit, JoinAst, OrderByAst, JoinType, RawValues, AstType, Order, GroupByAst } from "./sqlAstTypes";
import { ExprAst, ExprValAst, ExprFunAst, FunctionType, BuiltInFunc, ExprColumnAst, ExprType, ExprParen, ExprRelationAst } from "./exprAstTypes";

export default class Visitor extends AbstractParseTreeVisitor<ExpressionValue>
implements visitor.DIELVisitor<ExpressionValue> {
  private ir: DielAst;
  private templates: Map<string, DielTemplate>;

  defaultResult() {
    LogInternalError("All the visits should be handled");
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
      originalRelations: [],
      views: [],
      inserts: [],
      drops: [],
      programs: new Map(),
      crossfilters: [],
    };
    this.ir.udfTypes = ctx.registerTypeUdf().map(e => (
      this.visit(e) as UdfType
    )).concat(BuiltInUdfTypes);
    // two kinds of specifications
    this.ir.originalRelations = ctx.originalTableStmt().map(e => (
      this.visitOriginalTableStmt(e)
    ));
    // this.ir.outputs = ctx.outputStmt().map(e => (
    //   this.visit(e) as DerivedRelation
    // ));
    this.ir.views = ctx.viewStmt().map(e => (
      this.visit(e) as DerivedRelation
    ));
    this.ir.inserts = ctx.insertQuery().map(e => (
      this.visit(e) as InsertionClause
    ));
    this.ir.drops = ctx.dropQuery().map(e => (
      this.visit(e) as Drop
    ));
    const programs = ctx.programStmt().map(e => (
      this.visit(e) as ProgramsParserIr
    ));
    programs.map(p => this.ir.programs.set(p.input, p.queries));
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

  // outputs
  // visitOutputStmt(ctx: parser.OutputStmtContext): DerivedRelation {
  //   const name = ctx.IDENTIFIER().text;
  //   const selection = this.visit(ctx.selectQuery()) as RelationSelection;
  //   const constraints = ctx.constraintClause() ? this.visit(ctx.constraintClause()) as RelationConstraints : null;
  //   return {
  //     name,
  //     relationType: DerivedRelationType.Output,
  //     constraints,
  //     selection
  //   };
  // }

  visitSelectQueryDirect(ctx: parser.SelectQueryDirectContext): RelationSelection {
    // this is lazy, assume union or intersection to a hve the same columns
    const firstQuery = this.visit(ctx.selectUnitQuery()) as SelectionUnit;
    const compositeSelections = ctx.compositeSelect().map(e => this.visit(e) as CompositeSelectionUnit);
    return {
      astType: AstType.RelationSelection,
      compositeSelections: [{op: SetOperator.NA, relation: firstQuery}, ...compositeSelections]
    };
  }

  visitDropQuery(ctx: parser.DropQueryContext): Drop {
    const relationName = ctx.IDENTIFIER().text;
    return {
      relationName
    };
  }

  visitViewStmt(ctx: parser.ViewStmtContext): DerivedRelation {
    const name = ctx.IDENTIFIER().text;
    const relationType = ctx.VIEW()
      ? DerivedRelationType.View
      : DerivedRelationType.Output;
    const constraints = ctx.constraintClause() ? this.visit(ctx.constraintClause()) as RelationConstraints : null;
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
    const columnSelections = ctx.selectColumnClause().map(s => this.visit(s) as ColumnSelection);
    if (columnSelections.length < 1) {
      const selectQuery = ctx.selectColumnClause().map(s => getCtxSourceCode(s)).join(", ");
      throw new Error(`There should be some column values in select, query is ${selectQuery}`);
    }
    let body = null;
    if (ctx.FROM()) {
      const baseRelation = this.visit(ctx.relationReference()) as RelationReference;
      const joinClauses = ctx.joinClause().map(e => this.visit(e) as JoinAst);
      const whereClause = ctx.whereClause() ? this.visit(ctx.whereClause()) as ExprAst : null;
      const groupByClause = ctx.groupByClause() ? this.visitGroupByClause(ctx.groupByClause()) : null;
      const orderByClause = ctx.orderByClause() ? this.visitOrderByClause(ctx.orderByClause()) : null;
      const limitClause = ctx.limitClause() ? this.visitLimitClause(ctx.limitClause()) : null;
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
      columnSelections,
      ...body,
    };
  }

  visitSelectColumnClause(ctx: parser.SelectColumnClauseContext): ColumnSelection {
    const expr = this.visit(ctx.expr()) as ExprAst;
    const alias = ctx.IDENTIFIER() ? ctx.IDENTIFIER().text : null;
    return {
      alias,
      expr
    };
  }

  // begin level exprSimple
  visitExprSimple(ctx: parser.ExprSimpleContext): ExprAst {
    return this.visit(ctx.unitExpr()) as ExprAst;
  }

  // going to limit negation to boolean expressions for now
  visitExprNegate(ctx: parser.ExprNegateContext): ExprFunAst {
    return {
      exprType: ExprType.Func,
      dataType: DataType.Boolean,
      functionType: FunctionType.Logic,
      functionReference: "NOT",
      args: [this.visit(ctx.expr()) as ExprAst]
    };
  }

  visitUnitExprColumn(ctx: parser.UnitExprColumnContext): ExprColumnAst {
    const hasStar = ctx.STAR() ? true : false;
    const columnName = ctx._column ? ctx._column.text : undefined;
    const relationName = ctx._relation ? ctx._relation.text : undefined;
    return {
      exprType: ExprType.Column,
      dataType: DataType.TBD,
      hasStar,
      columnName,
      relationName,
    };
  }

  visitUnitExprSubQuery(ctx: parser.UnitExprSubQueryContext): ExprRelationAst {
    const selection = this.visit(ctx.selectQuery()) as RelationSelection;
    return {
      exprType: ExprType.Relation,
      dataType: DataType.Relation,
      selection,
    };
  }

  visitUnitExprValue(ctx: parser.UnitExprValueContext): ExprValAst {
    return this.visit(ctx.value()) as ExprValAst;
  }

  visitValueNumber(ctx: parser.ValueNumberContext): ExprValAst {
    return {
      exprType: ExprType.Val,
      dataType: DataType.Number,
      value: Number(ctx.NUMBER().text)
    };
  }

  visitValueString(ctx: parser.ValueStringContext): ExprValAst {
    return {
      exprType: ExprType.Val,
      dataType: DataType.String,
      value: ctx.STRING().text
    };
  }

  // begin paren
  visitExprParenthesis(ctx: parser.ExprParenthesisContext): ExprParen {
    return {
      dataType: DataType.TBD,
      exprType: ExprType.Parenthesis,
      content: this.visit(ctx.expr()) as ExprAst
    };
  }

  // begin
  visitExprConcat(ctx: parser.ExprConcatContext): ExprAst {
    const args = ctx.expr().map(e => this.visit(e) as ExprAst);
    return {
      exprType: ExprType.Val,
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
      exprType: ExprType.Func,
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
      exprType: ExprType.Func,
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
      exprType: ExprType.Func,
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
      exprType: ExprType.Func,
      dataType: DataType.Boolean,
      functionType: FunctionType.BuiltIn,
      functionReference,
      args: [arg]
    };
  }

  visitExprIn(ctx: parser.ExprInContext): ExprFunAst {
    const functionReference = BuiltInFunc.In;
    const args = ctx.expr();
    const arg1 = this.visit(args[0]) as ExprAst;
    const arg2 = this.visit(args[1]) as ExprAst;
    return {
      exprType: ExprType.Func,
      dataType: DataType.Boolean,
      functionType: FunctionType.BuiltIn,
      functionReference,
      args: [arg1, arg2]
    };
  }

  visitExprWhen(ctx: parser.ExprWhenContext): ExprFunAst {
    const func = BuiltInFunc.IfThisThen;
    const args = ctx.expr().map(e => this.visit(e) as ExprAst);
    return {
      exprType: ExprType.Func,
      dataType: DataType.TBD,
      functionType: FunctionType.BuiltIn,
      functionReference: func,
      args
    };
  }

  visitJoinClauseBasic(ctx: parser.JoinClauseBasicContext): JoinAst {
    const relation = this.visit(ctx.relationReference()) as RelationReference;
    const predicate = ctx.expr()
      ? this.visit(ctx.expr()) as ExprAst
      : null;
    const joinType = ctx.LEFT()
      ? JoinType.LeftOuter
      : ctx.JOIN()
        ? JoinType.Inner
        : JoinType.CROSS;
    return {
      astType: AstType.Join,
      joinType,
      relation,
      predicate
    };
  }

  visitGroupByClause(ctx: parser.GroupByClauseContext): GroupByAst {
    const selections = ctx.expr().map(e => this.visit(e) as ExprAst);
    const predicate = this.visitHavingClause(ctx.havingClause());
    return {
      selections,
      predicate
    };
  }

  visitHavingClause(ctx: parser.HavingClauseContext): ExprAst {
    return this.visit(ctx.expr()) as ExprAst;
  }

  visitLimitClause(ctx: parser.LimitClauseContext): ExprAst {
    return this.visit(ctx.expr()) as ExprAst;
  }

  visitOrderByClause(ctx: parser.OrderByClauseContext): OrderByAst[] {
    return ctx.orderSpec().map(s => this.visitOrderSpec(s));
  }

  visitOrderSpec(ctx: parser.OrderSpecContext): OrderByAst {
    const order = ctx.DESC ? Order.DESC : Order.ASC;
    return {
      selection: this.visit(ctx.expr()) as ExprAst,
      order
    };
  }

  visitWhereClause(ctx: parser.WhereClauseContext): ExprAst {
    return this.visit(ctx.expr()) as ExprAst;
  }

  // template basically saves the AST and the AST gets parsed again when evaluated here
  visitTemplateStmt(ctx: parser.TemplateStmtContext): string {
    // not going to return anything, modify global
    const templateName = ctx._templateName.text;
    const variables = ctx.IDENTIFIER().map(i => i.text).splice(1);
    let ast: RelationSelection | JoinAst;
    if (ctx.selectQuery()) {
      ast = this.visit(ctx.selectQuery()) as RelationSelection;
    } else if (ctx.joinClause()) {
      ast = this.visit(ctx.joinClause()) as JoinAst;
    }
    this.templates.set(templateName, {
      variables,
      ast
    });
    return "";
  }

  visitJoinClauseTemplate(ctx: parser.JoinClauseTemplateContext): JoinAst {
    return this.visit(ctx.templateQuery()) as JoinAst;
  }

  visitSelectQueryTemplate(ctx: parser.SelectQueryTemplateContext): RelationSelection {
    return this.visit(ctx.templateQuery()) as RelationSelection;
  }

  visitVariableAssignment(ctx: parser.VariableAssignmentContext): string[] {
    const str = ctx._assignment.text;
    return [ctx._variable.text, str.slice(1, str.length - 1)];
  }

  visitTemplateQuery(ctx: parser.TemplateQueryContext): JoinAst | RelationSelection {
    const templateName = ctx._templateName.text;
    const templateSpec = new Map(ctx.variableAssignment().map(v => this.visit(v) as [string, string]));
    const template = this.templates.get(templateName);
    template.ast.templateSpec = templateSpec;
    return template.ast;
  }

  visitRelationReferenceSimple(ctx: parser.RelationReferenceSimpleContext): RelationReference {
    const relationName = ctx._relation.text;
    // check if the name is a relation
    const alias = ctx._alias ? ctx._alias.text : null;
    return {
      alias,
      relationName
    };
  }

  visitRelationReferenceSubQuery(ctx: parser.RelationReferenceSubQueryContext): RelationReference {
    const subquery = this.visit(ctx.selectQuery()) as RelationSelection;
    const alias = ctx._alias ? ctx._alias.text : null;
    const q = getCtxSourceCode(ctx);
    // console.log(q);
    return {
      alias,
      subquery
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

  visitOriginalTableStmt(ctx: parser.OriginalTableStmtContext): OriginalRelation {
    if (ctx.INPUT() && ctx.REGISTER()) {
      ReportDielUserError(`You cannot register an input relation`);
    }
    const relationType = ctx.INPUT()
      ? OriginalRelationType.Input
      : ctx.CREATE()
        ? OriginalRelationType.Table
        : OriginalRelationType.ExistingAndImmutable;
    const name = ctx.IDENTIFIER().text;
    let columns: Column[] = [];
    let constraints: RelationConstraints = null;

    let copyFrom = undefined;
    const v = this.visit(ctx.relationDefintion());
    if (typeof v === "string") {
      copyFrom = v as string;
    } else {
      columns = (v as OriginalRelation).columns;
      constraints = (v as OriginalRelation).constraints;
    }

    return {
      relationType,
      name,
      columns,
      constraints,
      copyFrom
    };
  }

  visitRelationDefintionDirect(ctx: parser.RelationDefintionDirectContext): OriginalRelation {
    const columns = ctx.columnDefinition().map(e => this.visit(e) as Column);
    const constraints = this._processConstraintDefinitionHelper(ctx.constraintDefinition());
    // name and relationType are dummy to avoid having to add more to the union type...
    return {
      name: "",
      relationType: null,
      columns,
      constraints
    };
  }

  visitRelationDefintionCopy(ctx: parser.RelationDefintionCopyContext): string {
    return ctx.IDENTIFIER().text;
  }

  _processConstraintDefinitionHelper(ctxs: parser.ConstraintDefinitionContext[]): RelationConstraints {
    let primaryKey: string[] = [];
    let uniques: string[][] = [];
    let exprChecks: ExprAst[] = [];
    let notNull: string[] = [];
    let foreignKeys: ForeignKey[] = [];
    ctxs.map(e => {
      if (e.PRIMARY()) {
        primaryKey = e.IDENTIFIER().map(i => i.text);
      } else if (e.UNIQUE()) {
        const aUnique = e.IDENTIFIER().map(i => i.text);
        uniques.push(aUnique);
      } else if (e.NULL()) {
        notNull.push(e.IDENTIFIER()[0].text);
      } else if (e.CHECK()) {
        exprChecks.push(this.visit(e.expr()) as ExprAst);
      } else if (e.FOREIGN()) {
        foreignKeys.push({
          sourceColumn: e._column.text,
          targetRelation: e._table.text,
          targetColumn: e._otherColumn.text,
        });
      }
    });
    return {
      relationNotNull: false,
      relationHasOneRow: false,
      primaryKey,
      notNull,
      uniques,
      exprChecks,
      foreignKeys
    };

  }

  visitConstraintClause(ctx: parser.ConstraintClauseContext): RelationConstraints {
    return this._processConstraintDefinitionHelper(ctx.constraintDefinition());
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
  visitProgramStmtGeneral(ctx: parser.ProgramStmtGeneralContext): ProgramsParserIr {
    const queries = this.visit(ctx.programBody()) as ProgramSpec[];
    return {
      input: null,
      queries
    };
  }

  visitProgramStmtSpecific(ctx: parser.ProgramStmtSpecificContext): ProgramsParserIr {
    const input = ctx.IDENTIFIER().text;
    const queries = this.visit(ctx.programBody()) as ProgramSpec[];
    return {
      input,
      queries
    };
  }

  visitProgramBody(ctx: parser.ProgramBodyContext): ProgramSpec[] {
    const programs = ctx.aProgram().map(e => {
      if (e.insertQuery()) {
        return this.visit(e.insertQuery()) as InsertionClause;
      } else {
        return this.visit(e.selectQuery()) as RelationSelection;
      }
    });
    return programs;
  }

  visitInsertQuery(ctx: parser.InsertQueryContext): InsertionClause {
    const identifiers = ctx.IDENTIFIER().map(e => e.text);
    const relation = identifiers[0];
    const columns = identifiers.slice(1);
    // just look ahead now
    const v = this.visit(ctx.insertBody()) as RawValues | RelationSelection;
    let selection;
    let values;
    if (Array.isArray(v)) {
      values = v as RawValues;
    } else {
      selection = v as RelationSelection;
    }
    return {
      astType: AstType.Insert,
      relation,
      columns,
      selection,
      values
    };
  }

  visitInsertBodyDirect(ctx: parser.InsertBodyDirectContext): RawValues {
    return ctx.value().map(e => {
      const t = this.visit(e) as ExprValAst;
      return t.value;
    });
  }

  visitInsertBodySelect(ctx: parser.InsertBodySelectContext): RelationSelection {
    return this.visit(ctx.selectQuery()) as RelationSelection;
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