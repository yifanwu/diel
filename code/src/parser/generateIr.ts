import { AbstractParseTreeVisitor } from "antlr4ts/tree";
import * as parser from "./grammar/DIELParser";
import * as visitor from "./grammar/DIELVisitor";

import { ExpressionValue, Column, InputIr, OutputIr, SelectQueryIr, ProgramSpecIr, ProgramsIr, InsertQueryIr } from "./dielTypes";
import { parseColumnType, getCtxSourceCode } from "../compiler/helper";
import { LogStandout } from "../util/messages";

export default class Visitor extends AbstractParseTreeVisitor<ExpressionValue>
implements visitor.DIELVisitor<ExpressionValue> {
  // private result: DielIr;

  defaultResult() {
    return "";
  }
  visitQueries = (ctx: parser.QueriesContext) => {
    // should only be called once and executed for setup.
    const inputs:InputIr[] = ctx.inputStmt().map(e => (
      this.visit(e) as InputIr
    ));
    let outputs: OutputIr[] = ctx.outputStmt().map(e => (
      this.visit(e) as OutputIr
    ));
    let programs: ProgramsIr[] = ctx.programStmt().map(e => (
      this.visit(e) as ProgramsIr
    ));
    return {
      inputs,
      outputs,
      programs
    };
  }

  // outputs
  visitOutputStmt = (ctx: parser.OutputStmtContext) => {
    const name = ctx.IDENTIFIER().text;
    const s = this.visit(ctx.selectQuery()) as SelectQueryIr;
    const r: OutputIr = {
      name,
      columns: s.columns,
      query: s.query
    };
    return r;
  }
  
  visitSelectQuery(ctx: parser.SelectQueryContext): SelectQueryIr {
    const columns = ctx.selectClause().map(s => this.visit(s) as Column);
    if (columns.length < 1) {
      // TODO
    }
    const query = getCtxSourceCode(ctx);
    return {
      columns,
      query
    };
  }

  visitSelectClauseSimple(ctx: parser.SelectClauseSimpleContext) {
    // LogStandout(`visitSelectClauseSimple ${ctx.text}`);
    return this.visit(ctx.columnSelection());
  }

  visitColumnSelectionSimple(ctx: parser.ColumnSelectionSimpleContext) {
    // LogStandout(`visitColumnSelectionSimple ${ctx.IDENTIFIER().text}`);
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

  visitColumnDefinition(ctx: parser.ColumnDefinitionContext) {
    return {
      name: ctx.IDENTIFIER().text,
      type: parseColumnType(ctx.columnType().text)
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
    // const dependentRelations = ) as string[];
    return {
      relation,
      query,
    }
  }
  // visitInsertBody(ctx: parser.InsertBodyContext): string {
  //   return getCtxSourceCode(ctx);
  // }
  visitInsertQueryDirect(ctx: parser.InsertQueryDirectContext) {
    console.log("visiting insert values");
    ctx.value().map(v => console.log(v.text));
    return "";
  }
  // visitInsertQuerySelect(ctx: parser.InsertQuerySelectContext): string {
  //   const select = this.visit(ctx.selectQuery()) as SelectQueryIr;
  //   console.log("Visitng select query inside insert", select);
  //   return "";
  // }
}