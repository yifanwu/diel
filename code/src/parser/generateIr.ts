import { AbstractParseTreeVisitor } from "antlr4ts/tree";
import * as parser from "./grammar/DIELParser";
import * as visitor from "./grammar/DIELVisitor";

import { ExpressionValue, Column, RelationIr, DerivedRelationIr, SelectQueryIr, ProgramSpecIr, ProgramsIr, InsertQueryIr, SelectBodyIr, SelectQueryPartialIr } from "./dielTypes";
import { parseColumnType, getCtxSourceCode } from "../compiler/helper";
import { LogStandout } from "../util/messages";

export default class Visitor extends AbstractParseTreeVisitor<ExpressionValue>
implements visitor.DIELVisitor<ExpressionValue> {
  // private result: DielIr;
  private inputs: RelationIr[];
  private tables: RelationIr[];
  private views: DerivedRelationIr[];
  private outputs: DerivedRelationIr[];

  defaultResult() {
    return "";
  }
  visitQueries = (ctx: parser.QueriesContext) => {
    // should only be called once and executed for setup.
    const inputs: RelationIr[] = ctx.inputStmt().map(e => (
      this.visit(e) as RelationIr
    ));
    this.inputs = inputs;
    const tables: RelationIr[] = ctx.tableStmt().map(e => (
      this.visit(e) as RelationIr
    ));
    this.tables = tables;
    let outputs: DerivedRelationIr[] = ctx.outputStmt().map(e => (
      this.visit(e) as DerivedRelationIr
    ));
    let views: DerivedRelationIr[] = ctx.viewStmt().map(e => (
      this.visit(e) as DerivedRelationIr
    ));
    let programs: ProgramsIr[] = ctx.programStmt().map(e => (
      this.visit(e) as ProgramsIr
    ));
    return {
      inputs,
      tables,
      outputs,
      views,
      programs
    };
  }

  // outputs
  visitOutputStmt(ctx: parser.OutputStmtContext) {
    const name = ctx.IDENTIFIER().text;
    const s = this.visit(ctx.selectQuery()) as SelectQueryIr;
    const r: DerivedRelationIr = {
      name,
      columns: s.columns,
      query: s.query
    };
    return r;
  }

  visitSelectQuery(ctx: parser.SelectQueryContext) {
    // this is lazy, assume union or intersection to ahve the same columns
    const firstQuery = this.visit(ctx.selectUnitQuery()) as SelectQueryIr;
    const query = getCtxSourceCode(ctx);
    return {
      query,
      ...firstQuery,
    };
  }

  // TODO: do some type checking/inference on the selected.
  visitSelectQuerySpecific(ctx: parser.SelectQuerySpecificContext): SelectQueryPartialIr {
    const columns = ctx.selectClause().map(s => this.visit(s) as Column);
    if (columns.length < 1) {
      // TODO
    }
    const selectBody = this.visit(ctx.selectBody()) as SelectBodyIr;
    return {
      columns,
      relations: selectBody.relations,
    };
  }

  visitSelectQueryAll(ctx: parser.SelectQueryAllContext): SelectQueryPartialIr {
    // we need to figure out what tables where referenced
    const selectBody = this.visit(ctx.selectBody()) as SelectBodyIr;
    const relations = selectBody.relations;
    // need to look up the relations
    const columns = relations.reduce((acc: Column[], r) => acc.concat(this._findRelationColumns(r)), []);
    return {
      columns,
      relations,
    };
  }

  visitSelectBody(ctx: parser.SelectBodyContext): SelectBodyIr {
    const relation = this.visit(ctx.relationReference()) as string;
    const joinsInfo = ctx.joinClause().map(j => this.visit(j) as string);
    return {
      relations: [relation, ...joinsInfo]
    };
  }

  // ignore the predicates for now
  // might be useful for sanity checking later
  // as well as basic materialization
  visitJoinClause(ctx: parser.JoinClauseContext) {
    return this.visit(ctx.relationReference());
  }

  visitRelationReferenceSimple(ctx: parser.RelationReferenceSimpleContext) {
    return ctx._relation.text;
  }

  visitColumnSelectionSimple(ctx: parser.ColumnSelectionSimpleContext) {
    // LogStandout(`visitColumnSelectionSimple ${ctx.IDENTIFIER().text}`);
    return ctx.IDENTIFIER().text;
  }

  visitColumnSelectionReference(ctx: parser.ColumnSelectionReferenceContext) {
    return ctx._column.text;
  }

  visitInputStmt = (ctx: parser.InputStmtContext) => {
    return this.visit(ctx.relationDefintion());
  }

  visitTableStmt = (ctx: parser.TableStmtContext) => {
    return this.visit(ctx.relationDefintion());
  }

  visitRelationDefintion = (ctx: parser.RelationDefintionContext) => {
    const columns = ctx.columnDefinition().map(e => this.visit(e) as Column);
    const name = ctx.IDENTIFIER().text;
    const r: RelationIr = {
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

  visitInsertQueryDirect(ctx: parser.InsertQueryDirectContext) {
    console.log("visiting insert values");
    ctx.value().map(v => console.log(v.text));
    return "";
  }

  _findRelationColumns(relation: string): Column[] {
    // find in inputs, then tables, then views, and outputs
    const rs = this.tables.concat(this.inputs).concat(this.views).concat(this.outputs);
    for (let i = 0; i < rs.length; i++) {
      if (rs[i].name === relation) {
        return rs[i].columns;
      }
    }
    return [];
  }
}