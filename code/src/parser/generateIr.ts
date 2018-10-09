import { AbstractParseTreeVisitor } from "antlr4ts/tree";
import * as parser from "./grammar/DIELParser";
import * as visitor from "./grammar/DIELVisitor";

import { ExpressionValue, Column, InputIr, OutputIr, OutputIrPartial } from "./dielTypes";
import { parseColumnType, getCtxSourceCode } from "../compiler/helper";
import { LogStandout } from "../util/messages";

/*
 * BASIC SPEC
 * The goal of this visitor is two fold
 * - create the SQL strings to execute (at different places)
 * - create the helper functions to pass the view results
 * - create helper functions for ajax calls to remote servers
 */

export default class Visitor extends AbstractParseTreeVisitor<ExpressionValue>
implements visitor.DIELVisitor<ExpressionValue> {
  // private result: DielIr;

  defaultResult() {
    return "";
  }
  visitQueries = (ctx: parser.QueriesContext) => {
    // should only be called once and executed for setup.
    let inputs:InputIr[] = [];
    let outputs: OutputIr[] = [];
  
    ctx.inputStmt().forEach(e => {
      inputs.push(this.visit(e) as InputIr);
    });
    ctx.outputStmt().forEach(e => {
      outputs.push(this.visit(e) as OutputIr);
    });
    return {
      inputs,
      outputs
    };
  }

  visitOutputStmt = (ctx: parser.OutputStmtContext) => {
    this.visit(ctx.selectQuery());
    const name = ctx.IDENTIFIER().text;
    const s = this.visit(ctx.selectQuery()) as OutputIrPartial;
    const r: OutputIr = {
      name,
      columns: s.columns,
      query: s.query
    };
    return r;
  }
  
  visitSelectQuery(ctx: parser.SelectQueryContext) {
    const columns = ctx.selectClause().map(s => this.visit(s) as Column);
    if (columns.length < 1) {
    }
    const query = getCtxSourceCode(ctx);
    return {
      columns,
      query
    };
  }

  visitSelectClauseSimple(ctx: parser.SelectClauseSimpleContext) {
    LogStandout(`visitSelectClauseSimple ${ctx.text}`);
    return this.visit(ctx.columnSelection());
  }

  visitColumnSelectionSimple(ctx: parser.ColumnSelectionSimpleContext) {
    LogStandout(`visitColumnSelectionSimple ${ctx.IDENTIFIER().text}`);
    return ctx.IDENTIFIER().text;
  }

  visitColumnSelectionReference(ctx: parser.ColumnSelectionReferenceContext) {
    LogStandout(`visitColumnSelectionReference ${ctx._column.text}`);
    return ctx._column.text;
  }
  visitInputStmt = (ctx: parser.InputStmtContext) => {
    const columns = ctx.columnDefinition().map(e => this.visit(e) as Column);
    const name = ctx.IDENTIFIER().text;
    const r: InputIr = {
      name,
      columns
    };
    return r;
  }

  visitColumnDefinition = (ctx: parser.ColumnDefinitionContext) => {
    return {
      name: ctx.IDENTIFIER().text,
      type: parseColumnType(ctx.columnType().text)
    };
  }
}