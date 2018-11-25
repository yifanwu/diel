import { AbstractParseTreeVisitor } from "antlr4ts/tree";
import * as parser from "./grammar/DIELParser";
import * as visitor from "./grammar/DIELVisitor";
import { TemplateExpressionValue, TemplateIr, TemplateVisitorIr, TemplateVariableAssignments, TemplateType } from "./dielTemplateTypes";
import { LogWarning, LogTmp, ReportDielUserError } from "../../lib/messages";
import { getCtxSourceCode } from "../helper";

export default class TemplateVisitor extends AbstractParseTreeVisitor<TemplateExpressionValue>
implements visitor.DIELVisitor<TemplateExpressionValue> {
  private ir: TemplateVisitorIr;

  visitQueries = (ctx: parser.QueriesContext): string => {
    this.ir = {
      templates: [],
    };
    // should only be called once and executed for setup.
    this.ir.templates = ctx.templateStmt().map(e => (
      this.visit(e) as TemplateIr
    ));

    // stuff that does not need to be processed
    const original = ctx.dropQuery().map(e => (
        this.visitDropQuery(e)
      )).concat(ctx.registerTypeTable().map(e => (
        this.visitRegisterTypeTable(e)
      ))).concat(ctx.registerTypeUdf().map(e => (
        this.visitRegisterTypeUdf(e)
      )));
    // TODO: haven't added templating to all the statements yet...?
    const templated: string[] = ctx.outputStmt().map(e => (
      this.visitOutputStmt(e)
    )).concat(ctx.viewStmt().map(e => (
      this.visitViewStmt(e)
    ))).concat(ctx.inputStmt().map(e => (
      this.visitInputStmt(e)
    ))).concat(ctx.crossfilterStmt().map(e => (
      this.visitCrossfilterStmt(e)
    )));

    return original.concat(templated).join("\n--gen\n");
  }

  // now we need to do programStmt and crossftilerStmt
  // TODO: check if missing others
  visitCrossfilterStmt(ctx: parser.CrossfilterStmtContext) {
    const crossfilterChartStmts = ctx.crossfilterChartStmt().map(e => this.visit(e));
    return `
      CREATE CROSSFILTER ${ctx._crossfilterName.text} ON ${ctx._relation.text}
      BEGIN
        ${crossfilterChartStmts.join("\n")}
      END;
    `;
  }
  visitCrossfilterChartStmt(ctx: parser.CrossfilterChartStmtContext) {
    return `
    CREATE XCHART ${ctx._chart.text}
    AS ${this.visit(ctx._definitionQuery)}
    WITH PREDICATE ${this.visit(ctx._predicateClause)};
    `;
  }
  visitInputStmt(ctx: parser.InputStmtContext): string {
    return `CREATE INPUT ${ctx.IDENTIFIER().text} ${this.visit(ctx.relationDefintion())};`;
  }

  visitOutputStmt(ctx: parser.OutputStmtContext): string {
    return `CREATE OUTPUT ${ctx.viewConstraints().text} ${ctx.IDENTIFIER().text} AS ${this.visit(ctx.selectQuery())};`;
  }
  visitViewStmt(ctx: parser.ViewStmtContext): string {
    return `
      CREATE ${ctx.PUBLIC() ? "PUBLIC" : ""}
      ${getCtxSourceCode(ctx.viewConstraints())}
      VIEW ${ctx.IDENTIFIER().text}
      AS ${this.visit(ctx.selectQuery())};`;
  }
  visitDynamicTableStm(ctx: parser.DynamicTableStmtContext) {
    return `CREATE DYNAMIC TABLE ${ctx.IDENTIFIER().text} ${this.visit(ctx.relationDefintion())};`;
  }
  visitRelationDefintionSimple(ctx: parser.RelationDefintionSimpleContext)  {
    return getCtxSourceCode(ctx);
  }
  visitRelationDefintionTemplate(ctx: parser.RelationDefintionTemplateContext) {
    return this.visit(ctx.templateQuery());
  }
  visitSelectQueryDirect(ctx: parser.SelectQueryDirectContext): string {
    const composite = ctx.compositeSelect().map(e => this.visit(e)).join("\n");
    return `${this.visit(ctx.selectUnitQuery())} ${composite}`;
  }
  visitSelectQueryTemplate(ctx: parser.SelectQueryTemplateContext): string {
    return this.visitTemplateQuery(ctx.templateQuery());
  }
  visitSelectUnitQuerySpecific(ctx: parser.SelectUnitQuerySpecificContext): string {
    const selects = ctx.selectClause().map(e => getCtxSourceCode(e)).join(", ");
    const body = ctx.selectBody() ? this.visit(ctx.selectBody()) : "";
    return `SELECT ${selects} ${body}`;
  }
  visitSelectUnitQueryAll(ctx: parser.SelectUnitQueryAllContext) {
    const body = this.visit(ctx.selectBody());
    return `SELECT * ${body}`;
  }
  visitSelectBody(ctx: parser.SelectBodyContext) {
    const relationReference = this.visit(ctx.relationReference());
    const joins = ctx.joinClause().map(e => this.visit(e)).join("\n");
    const groupByClause = getCtxSourceCode(ctx.groupByClause());
    const orderByClause = getCtxSourceCode(ctx.orderByClause());
    const limitClause = getCtxSourceCode(ctx.limitClause());
    const whereClause = ctx.whereClause() ? this.visit(ctx.whereClause()) : "";
    return `FROM ${relationReference} ${joins} ${whereClause} ${groupByClause} ${orderByClause} ${limitClause}`;
  }
  visitJoinClauseBasic(ctx: parser.JoinClauseBasicContext) {
    const relationReference = this.visit(ctx.relationReference());
    const predicate = ctx.predicates() ? `ON ${this.visit(ctx.predicates())}` : "";
    return `${ctx.LEFT() ? "LEFT OUTER" : ""} JOIN ${relationReference} ${predicate}`;
  }
  visitJoinClauseCross(ctx: parser.JoinClauseCrossContext) {
    return `, ${this.visit(ctx.relationReference())}`;
  }
  visitJoinClauseTemplate(ctx: parser.JoinClauseTemplateContext) {
    return this.visit(ctx.templateQuery());
  }
  visitRelationReferenceSimple(ctx: parser.RelationReferenceSimpleContext) {
    return getCtxSourceCode(ctx);
  }
  visitRelationReferenceSubQuery(ctx: parser.RelationReferenceSubQueryContext) {
    const selectQuery = this.visit(ctx.selectQuery());
    const alias = ctx.AS() ? `AS ${ctx._alias.text}` : "";
    return `(${selectQuery}) ${alias}`;
  }

  visitWhereClause(ctx: parser.WhereClauseContext) {
    // split for debugger inspection
    const r = `WHERE ${this.visit(ctx.predicates())}`;
    return r;
  }
  // now predicates... wow this is a mini nightmare
  visitPredicateClauseSingle(ctx: parser.PredicateClauseSingleContext): string {
    const r = this.visit(ctx.singlePredicate()) as string;
    return r;
  }
  visitSinglePredicateExpr(ctx: parser.SinglePredicateExprContext) {
    const r = this.visit(ctx.expr());
    return r;
  }
  visitSinglePredicateCompare(ctx: parser.SinglePredicateCompareContext): string {
    return `${this.visit(ctx.expr()[0])} ${ctx.compareOp().text} ${this.visit(ctx.expr()[1])}`;
  }
  visitSinglePredicateNull(ctx: parser.SinglePredicateNullContext): string {
    return `${this.visit(ctx.expr())} IS ${ctx.NOT() ? "NOT" : ""} NULL`;
  }
  visitSinglePredicateNotExist(ctx: parser.SinglePredicateNotExistContext): string {
    return `${ctx.NOT() ? "NOT" : ""} EXIST (${this.visit(ctx.selectUnitQuery())})`;
  }

  // then do the expr parsing!! fun :(((
  visitExprSimple(ctx: parser.ExprSimpleContext): string {
    return this.visit(ctx.unitExpr()) as string;
  }
  // predicates needs to be visited
  visitExprFunction(ctx: parser.ExprFunctionContext) {
    return `${ctx._function.text} (${this.visit(ctx.funExpr())})`;
  }
  visitExprMath(ctx: parser.ExprMathContext) {
    return `${this.visit(ctx.expr()[0])} ${ctx.mathOp().text} ${this.visit(ctx.expr()[1])}`;
  }
  visitExprWhen(ctx: parser.ExprWhenContext) {
    return `CASE WHEN  ${this.visit(ctx.predicates())} THEN ${this.visit(ctx.expr()[0])} ELSE ${this.visit(ctx.expr()[1])} END`;
  }
  // OK all the function expressions...
  visitFunExprMultiple(ctx: parser.FunExprMultipleContext) {
    return `${this.visit(ctx.funExpr()[0])} ${ctx.COMMA() ? "," : "||"} ${this.visit(ctx.funExpr()[1])}`;
  }
  visitFunExprStar(ctx: parser.FunExprStarContext) {
    return getCtxSourceCode(ctx);
  }
  visitColumnSelection(ctx: parser.ColumnSelectionContext): string {
    return getCtxSourceCode(ctx);
  }
  visitUnitExprNumber(ctx: parser.UnitExprNumberContext): string {
    return ctx.NUMBER().text;
  }
  visitUnitExprString(ctx: parser.UnitExprStringContext): string {
    return ctx.STRING().text;
  }
  visitUnitExprSubQuery(ctx: parser.UnitExprSubQueryContext): string {
    return `(${this.visit(ctx.selectUnitQuery())})`;
  }

  // these are just filler code
  // TODO: think about optimizing
  visitRegisterTypeTable(ctx: parser.RegisterTypeTableContext): string {
    return getCtxSourceCode(ctx);
  }
  visitRegisterTypeUdf(ctx: parser.RegisterTypeUdfContext): string {
    return getCtxSourceCode(ctx);
  }
  visitDropQuery(ctx: parser.DropQueryContext): string {
    return getCtxSourceCode(ctx);
  }

  visitTemplateStmt(ctx: parser.TemplateStmtContext): TemplateIr {
    const templateName = ctx._templateName.text;
    // make sure that this is expected
    const variables = ctx.IDENTIFIER().map(i => i.text).splice(1);
    let query;
    let templateType: TemplateType = null;
    if (ctx.selectQuery()) {
      query = getCtxSourceCode(ctx.selectQuery());
      templateType = TemplateType.Select;
    } else if (ctx.joinClause()) {
      query = getCtxSourceCode(ctx.joinClause());
      templateType = TemplateType.Join;
    } else if (ctx.joinClause()) {
       query = getCtxSourceCode(ctx.joinClause());
      templateType = TemplateType.Join;
    } else {
      const raw = getCtxSourceCode(ctx);
      ReportDielUserError(`Template must be either select, join, or schema definition, but we had:\n${raw}`);
    }
    return {
      templateType,
      templateName,
      variables,
      query,
    };
  }
  // This is for using the template
  visitTemplateQuery(ctx: parser.TemplateQueryContext): string {
    const values = ctx.variableAssignment().map(v => this.visit(v) as TemplateVariableAssignments);
    const templateName = ctx._templateName.text;
    LogTmp(`Processed template ${templateName}`);
    const t = this.ir.templates.find(i => i.templateName === templateName);
    return this._getTemplate(t, values);
  }
  visitVariableAssignment(ctx: parser.VariableAssignmentContext): TemplateVariableAssignments {
    // need to get rid of the quotes
    const str = ctx._assignment.text;
    return {
      variable: ctx._variable.text,
      assignment: str.slice(1, str.length - 1)
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
  defaultResult() {
    LogWarning("All the visits should be handled");
    return "";  }
}