import { AbstractParseTreeVisitor } from "antlr4ts/tree";
import * as parser from "./grammar/DIELParser";
import * as visitor from "./grammar/DIELVisitor";
import { TemplateExpressionValue, TemplateIr, TemplateVisitorIr, TemplateVariableAssignments } from "./dielTemplateTypes";
import { LogWarning, LogTmp } from "../lib/messages";
import { getCtxSourceCode } from "../compiler/helper";

export default class Visitor extends AbstractParseTreeVisitor<TemplateExpressionValue>
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
    const original = ctx.inputStmt().map(e => (
        this.visitInputStmt(e)
      )).concat(ctx.dropQuery().map(e => (
        this.visitDropQuery(e)
      ))).concat(ctx.registerTypeTable().map(e => (
        this.visitRegisterTypeTable(e)
      ))).concat(ctx.registerTypeUdf().map(e => (
        this.visitRegisterTypeUdf(e)
      )));
    const templated: string[] = [];

    return original.concat(templated).join("\n");
  }

  visitOutputStmt(ctx: parser.OutputStmtContext): string {
    return `CREATE OUTPUT ${ctx.viewConstraints().text} ${ctx.IDENTIFIER().text} AS ${this.visit(ctx.selectQuery())};`;
  }
  visitSelectQueryDirect(ctx: parser.SelectQueryDirectContext): string {
    const composite = ctx.compositeSelect().map(e => this.visit(e)).join("\n");
    return `${this.visit(ctx.selectUnitQuery())} ${composite}`;
  }
  visitSelectQueryTemplate(ctx: parser.SelectQueryTemplateContext): string {
    return this.visitTemplateQuery(ctx.templateQuery());
  }
  visitSelectUnitQuerySpecific(ctx: parser.SelectQuerySpecificContext): string {
    const selects = ctx.selectClause().map(e => getCtxSourceCode(e)).join(", ");
    const body = ctx.selectBody() ? this.visit(ctx.selectBody()) : "";
    return `SELECT ${selects} ${body}`;
  }
  visitSelectQueryAll(ctx: parser.SelectQueryAllContext) {
    const body = this.visit(ctx.selectBody());
    return `SELECT * ${body}`;
  }
  visitSelectBody(ctx: parser.SelectBodyContext) {
    const joins = ctx.joinClause().map(e => this.visit(e)).join("\n");
    const groupByClause = getCtxSourceCode(ctx.groupByClause());
    const orderByClause = getCtxSourceCode(ctx.orderByClause());
    const limitClause = getCtxSourceCode(ctx.limitClause());
    return `FROM ${joins} ${this.visit(ctx.whereClause())} ${groupByClause} ${orderByClause} ${limitClause}`;
  }
  visitWhereClause(ctx: parser.WhereClauseContext) {
    return `WHERE ${this.visit(ctx.predicates())}`;
  }
  // now predicates... wow this is a mini nightmare
  visitPredicateClauseSingle(ctx: parser.PredicateClauseSingleContext): string {
    return this.visit(ctx.singlePredicate()) as string;
  }
  visitSinglePredicateExpr(ctx: parser.SinglePredicateExprContext) {
    return this.visit(ctx.expr());
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
  visitInputStmt(ctx: parser.InputStmtContext): string {
    return getCtxSourceCode(ctx);
  }
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
    if (ctx.selectQuery()) {
      query = getCtxSourceCode(ctx.selectQuery());
    } else {
      query = getCtxSourceCode(ctx.joinClause());
    }
    return {
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