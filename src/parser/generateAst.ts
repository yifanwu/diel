import { AbstractParseTreeVisitor } from "antlr4ts/tree";
import * as parser from "./grammar/DIELParser";
import * as visitor from "./grammar/DIELVisitor";

import { ExpressionValue, DerivedRelation, Command, CrossFilterChartIr, CrossFilterIr, DielAst, DielDataType, UdfType, BuiltInUdfTypes, OriginalRelation, RelationConstraints, RelationType, DielTemplate, ForeignKey, ProgramsParserIr, InsertionClause, DropClause, Column, RelationReference, RelationSelection, CompositeSelectionUnit, ColumnSelection, SetOperator, SelectionUnit, JoinAst, OrderByAst, JoinType, RawValues, AstType, Order, GroupByAst, createEmptyDielAst, ColumnConstraints, DeleteClause, ExprAst, ExprValAst, ExprFunAst, FunctionType, BuiltInFunc, ExprColumnAst, ExprType, ExprParen, ExprRelationAst, DropType, Relation, NewRelationConstraints, ExprStarAst, RelationReferenceType, RelationReferenceDirect, RelationReferenceSubquery } from "./dielAstTypes";
import { parseColumnType, getCtxSourceCode } from "./visitorHelper";
import { LogInfo, LogInternalError, ReportDielUserError } from "../util/messages";

export default class Visitor extends AbstractParseTreeVisitor<ExpressionValue>
implements visitor.DIELVisitor<ExpressionValue> {
  private ast: DielAst;
  private templates: Map<string, DielTemplate>;
  // this is to avoid visiting commands that are defined in programs
  // must be a better programming pattern to deal with this, hack for now... :/
  // private seenInserts: number[];

  defaultResult() {
    LogInternalError("All the visits should be handled");
    return "";
  }

  getAndCopyTemplateAst(templateName: string): JoinAst | RelationSelection | null {
    const tDef = this.templates.get(templateName);
    if (tDef) {
      let newAst = null;
      switch (tDef.ast.astType) {
        case AstType.Join:
          newAst = JSON.parse(JSON.stringify(tDef.ast)) as JoinAst;
          break;
        case AstType.RelationSelection:
          newAst = JSON.parse(JSON.stringify(tDef.ast)) as RelationSelection;
          break;
        default:
          LogInternalError(`Other AstTypes are not supported for template`);
      }
      return newAst;
    } else {
      LogInternalError(`Template ${templateName} not defined`);
      return null;
    }
  }
  // this is useful for compiling partial queries
  setContext(ir: DielAst) {
    LogInfo("setting context");
    this.ast = ir;
  }

  // this is serving also as a constrcutor
  // look into if there is a cleaner way to do this
  visitQueries = (ctx: parser.QueriesContext): DielAst => {
    this.ast = createEmptyDielAst();
    // this.seenInserts = [];
    this.templates = new Map();
    ctx.templateStmt().map(e => this.visitTemplateStmt(e));
    this.ast.udfTypes = ctx.registerTypeUdf().map(e => (
      this.visit(e) as UdfType
    )).concat(BuiltInUdfTypes);
    // two kinds of specifications
    const originalRelations = ctx.originalTableStmt().map(e => (
      this.visitOriginalTableStmt(e)
    )) as Relation[];
    const derivedRelations = ctx.viewStmt().map(e => (
        this.visit(e) as DerivedRelation
    ));
    this.ast.relations = originalRelations.concat(derivedRelations);
    // programs
    const programs = ctx.programStmt().map(e => (
      this.visit(e) as ProgramsParserIr
    ));
    // console.log("raw programs", JSON.stringify(programs, null, 2));
    // console.log("current seen", JSON.stringify(this.seenInserts));
    programs.map(p => {
      p.events.map(e => {
        const eventProgram = this.ast.programs.get(e);
        if (eventProgram) {
          eventProgram.push(...p.queries);
        } else {
          this.ast.programs.set(e, p.queries);
        }
      });
    });
    // commands
    // make sure not to execute the inserts that have been executed in programs.
    const insert = ctx.insertQuery()
      // .filter(e => this.seenInserts.find(i => i === e.start.startIndex) === null)
      .map(e => (
        this.visit(e) as InsertionClause
      )) as Command[];
    const drops = ctx.dropQuery().map(e => (
      this.visit(e) as DropClause
    ));
    const deletes = ctx.deleteStmt().map(e => (
      this.visit(e) as DeleteClause
    ));
    this.ast.commands = insert.concat(drops).concat(deletes);
    this.ast.crossfilters = ctx.crossfilterStmt().map(e => (
      this.visit(e) as CrossFilterIr
    ));
    return this.ast;
  }

  visitRegisterTypeUdf(ctx: parser.RegisterTypeUdfContext): UdfType {
    const udf = ctx.IDENTIFIER().text;
    const type = parseColumnType(ctx.dataType().text);
    return {
      udf,
      type
    };
  }

  // visitSelectQuery(ctx: parser.SelectQueryContext): RelationSelection {
  //   return this.visit(ctx) as RelationSelection;
  //   // if (ctx.)
  //   // return this.visit(ctx.getRuleContext());
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

  visitCompositeSelect(ctx: parser.CompositeSelectContext): CompositeSelectionUnit | null {
    const relation = this.visit(ctx.selectUnitQuery()) as SelectionUnit;
    const rawOp = ctx.setOp().text.toLocaleUpperCase();
    const op = (rawOp === "UNION")
      ? SetOperator.UNION
      : (rawOp === "INTERSECT")
        ? SetOperator.INTERSECT
        : null;
    if (!op) {
      return LogInternalError(`Shouldn't Happen!`);
    }
    return {
      op,
      relation
    };
  }

  visitDropQuery(ctx: parser.DropQueryContext): DropClause {
    const dropName = ctx.IDENTIFIER().text;
    return {
      astType: AstType.RelationSelection,
      dropType: DropType.Table,
      dropName,
    };
  }

  visitDeleteStmt(ctx: parser.DeleteStmtContext): DeleteClause {
    const relationName = ctx.IDENTIFIER().text;
    const expr = ctx.expr();
    const predicate = ctx.WHERE() && expr
      ? this.visit(expr) as ExprAst
      : undefined;
    return {
      astType: AstType.Delete,
      relationName,
      predicate
    };
  }

  visitViewStmt(ctx: parser.ViewStmtContext): DerivedRelation {
    const name = ctx.IDENTIFIER().text;
    const relationType = ctx.VIEW()
      ? ctx.EVENT()
        ? RelationType.EventView
        : RelationType.View
      : ctx.TABLE()
        ? RelationType.DerivedTable
        : RelationType.Output;
    const cClause = ctx.constraintClause();
    const constraints = cClause ? this.visit(cClause) as RelationConstraints : NewRelationConstraints();
    const selection = this.visit(ctx.selectQuery()) as RelationSelection;
    return {
      rName: name,
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
    const isDistinct = ctx.DISTINCT() ? true : false;
    if (ctx.FROM()) {
      const bClause = ctx.relationReference();
      const baseRelation = (bClause) ? this.visit(bClause) as RelationReference : undefined;
      const joinClauses = ctx.joinClause().map(e => this.visit(e) as JoinAst);
      const wClause = ctx.whereClause();
      const whereClause = wClause ? this.visit(wClause) as ExprAst : undefined;
      const gClause = ctx.groupByClause();
      const groupByClause = gClause ? this.visitGroupByClause(gClause) : undefined;
      const oClause = ctx.orderByClause();
      const orderByClause = oClause ? this.visitOrderByClause(oClause) : undefined;
      const lClause = ctx.limitClause();
      const limitClause = lClause ? this.visitLimitClause(lClause) : undefined;
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
      isDistinct,
      columnSelections,
      ...body,
    };
  }

  visitSelectColumnClause(ctx: parser.SelectColumnClauseContext): ColumnSelection {
    const expr = this.visit(ctx.expr()) as ExprAst;
    const aliasText = ctx.IDENTIFIER();
    const alias = aliasText ? aliasText.text : undefined;
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
      dataType: DielDataType.Boolean,
      functionType: FunctionType.Logic,
      functionReference: "NOT",
      args: [this.visit(ctx.expr()) as ExprAst]
    };
  }

  visitUnitExprColumn(ctx: parser.UnitExprColumnContext): ExprColumnAst | ExprStarAst {
    const hasStar = ctx.STAR() ? true : false;
    const columnName = ctx._column ? ctx._column.text : undefined;
    const relationName = ctx._relation ? ctx._relation.text : undefined;
    if (hasStar) {
      return {
        exprType: ExprType.Star,
        relationName
      };
    }
    return {
      exprType: ExprType.Column,
      columnName,
      relationName,
    };
  }

  visitUnitExprSubQuery(ctx: parser.UnitExprSubQueryContext): ExprRelationAst {
    const selection = this.visit(ctx.selectQuery()) as RelationSelection;
    return {
      exprType: ExprType.Relation,
      dataType: DielDataType.Relation,
      selection,
    };
  }

  visitUnitExprValue(ctx: parser.UnitExprValueContext): ExprValAst {
    return this.visit(ctx.value()) as ExprValAst;
  }

  visitValueNumber(ctx: parser.ValueNumberContext): ExprValAst {
    return {
      exprType: ExprType.Val,
      dataType: DielDataType.Number,
      value: Number(ctx.NUMBER().text)
    };
  }

  visitValueString(ctx: parser.ValueStringContext): ExprValAst {
    // because string contains the ', we need to strip it
    const raw = ctx.STRING().text;
    return {
      exprType: ExprType.Val,
      dataType: DielDataType.String,
      value: raw.slice(1, raw.length - 1)
    };
  }

  visitValueBoolean(ctx: parser.ValueBooleanContext): ExprValAst {
    const value = (ctx.BOOLEANVAL().text === "true")
      ? true
      : false;
    return {
      exprType: ExprType.Val,
      dataType: DielDataType.String,
      value
    };
  }
  // begin paren
  visitExprParenthesis(ctx: parser.ExprParenthesisContext): ExprParen {
    return {
      exprType: ExprType.Parenthesis,
      content: this.visit(ctx.expr()) as ExprAst
    };
  }

  // begin
  visitExprConcat(ctx: parser.ExprConcatContext): ExprAst {
    const args = ctx.expr().map(e => this.visit(e) as ExprAst);
    return {
      exprType: ExprType.Val,
      dataType: DielDataType.String,
      functionType: FunctionType.BuiltIn,
      functionReference: BuiltInFunc.ConcatStrings,
      args
    };
  }

  visitExprFunction(ctx: parser.ExprFunctionContext): ExprFunAst | null {
    const functionReference = ctx._function.text;
    const args = ctx.expr().map(e => this.visit(e) as ExprAst);
    // think about a more elegant comparison
    if (!functionReference) {
      return ReportDielUserError(`Function name must be specified`);
    }
    return {
      exprType: ExprType.Func,
      functionType: FunctionType.Custom,
      functionReference,
      args
    };
  }

  // begin level
  visitExprBinOp(ctx: parser.ExprBinOpContext): ExprFunAst {
    let functionType = FunctionType.Logic;
    let functionReference;
    let dataType = DielDataType.Boolean;
    if (ctx.mathOp()) {
      functionType = FunctionType.Math;
      functionReference = getCtxSourceCode(ctx.mathOp());
      dataType = DielDataType.Number;
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

  visitExprNotNull(ctx: parser.ExprNotNullContext): ExprFunAst {
    // const functionReference = ctx.NOT() ?  : BuiltInFunc.ValueIsNull;
    const arg = this.visit(ctx.expr()) as ExprAst;
    return {
      exprType: ExprType.Func,
      dataType: DielDataType.Boolean,
      functionType: FunctionType.BuiltIn,
      functionReference: BuiltInFunc.ValueIsNotNull,
      args: [arg]
    };
  }

  // begin
  visitExprNull(ctx: parser.ExprNullContext): ExprFunAst {
    // const functionReference = ctx.NOT() ? BuiltInFunc.ValueIsNotNull : ;
    const arg = this.visit(ctx.expr()) as ExprAst;
    return {
      exprType: ExprType.Func,
      dataType: DielDataType.Boolean,
      functionType: FunctionType.BuiltIn,
      functionReference: BuiltInFunc.ValueIsNull,
      args: [arg]
    };
  }

  visitExprExist(ctx: parser.ExprExistContext): ExprFunAst {
    const functionReference = ctx.NOT() ? BuiltInFunc.SetNotEmpty : BuiltInFunc.SetEmpty;
    const arg = this.visit(ctx.expr()) as ExprAst;
    return {
      exprType: ExprType.Func,
      dataType: DielDataType.Boolean,
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
      dataType: DielDataType.Boolean,
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
      functionType: FunctionType.BuiltIn,
      functionReference: func,
      args
    };
  }

  visitJoinClauseBasic(ctx: parser.JoinClauseBasicContext): JoinAst {
    const relation = this.visit(ctx.relationReference()) as RelationReference;
    const pExpr = ctx.expr();
    const predicate = pExpr
      ? this.visit(pExpr) as ExprAst
      : undefined;
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
    const hClause = ctx.havingClause();
    const predicate = hClause ? this.visitHavingClause(hClause) : undefined;
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
  visitTemplateStmt(ctx: parser.TemplateStmtContext): null {
    // not going to return anything, modify global
    const templateName = ctx._templateName.text;
    if (!templateName) {
      return ReportDielUserError(`Template name must be specified`);
    }
    const variables = ctx.IDENTIFIER().map(i => i.text).splice(1);
    const sQuery = ctx.selectQuery();
    const jQuery = ctx.joinClause();
    if (sQuery) {
      const ast = this.visit(sQuery) as RelationSelection;
      this.templates.set(templateName, {
        variables,
        ast
      });
    } else if (jQuery) {
      const ast = this.visit(jQuery) as JoinAst;
      this.templates.set(templateName, {
        variables,
        ast
      });
    }
    return null;
  }

  visitJoinClauseTemplate(ctx: parser.JoinClauseTemplateContext): JoinAst {
    return this.visit(ctx.templateQuery()) as JoinAst;
  }

  visitSelectQueryTemplate(ctx: parser.SelectQueryTemplateContext): RelationSelection {
    return this.visit(ctx.templateQuery()) as RelationSelection;
  }

  visitVariableAssignment(ctx: parser.VariableAssignmentContext): string[] | null {
    const str = ctx._assignment.text;
    if ((!ctx._variable.text) || !str) {
      return ReportDielUserError(`Variable name must be specified`);
    }
    return [ctx._variable.text, str.slice(1, str.length - 1)];
  }

  visitTemplateQuery(ctx: parser.TemplateQueryContext): JoinAst | RelationSelection | null {
    const templateName = ctx._templateName.text;
    if (!templateName) {
      return ReportDielUserError(`Template name must be specified`);
    }
    const templateSpec = new Map(ctx.variableAssignment().map(v => this.visit(v) as [string, string]));
    const templateAst = this.getAndCopyTemplateAst(templateName);
    if (!templateAst) {
      return ReportDielUserError(`Template ${templateName} must be defined`);
    }
    templateAst.templateSpec = templateSpec;
    return templateAst;
  }

  visitRelationReferenceSimple(ctx: parser.RelationReferenceSimpleContext): RelationReferenceDirect {
    const relationName = ctx._relation.text;
    const isLatest = ctx.LATEST() ? true : false;
    // check if the name is a relation
    const alias = ctx._alias ? ctx._alias.text : undefined;
    return {
      relationReferenceType: RelationReferenceType.Direct,
      alias,
      isLatest,
      relationName
    };
  }

  visitRelationReferenceSubQuery(ctx: parser.RelationReferenceSubQueryContext): RelationReferenceSubquery {
    const subquery = this.visit(ctx.selectQuery()) as RelationSelection;
    const alias = ctx._alias ? ctx._alias.text : undefined;
    // console.log(q);
    return {
      wasFromLatest: false,
      relationReferenceType: RelationReferenceType.Subquery,
      alias,
      subquery
    };
  }

  // visitStaticTableStmt(ctx: parser.StaticTableStmtContext): DerivedRelation {
  //   // it would not be the case of server here.
  //   const name = ctx.IDENTIFIER().text;
  //   const relationType = RelationType.StaticTable;
  //   const selection = this.visit(ctx.selectQuery()) as RelationSelection;
  //   return {
  //     name,
  //     relationType,
  //     selection
  //   };
  // }

  visitOriginalTableStmt(ctx: parser.OriginalTableStmtContext): OriginalRelation {
    if (ctx.EVENT() && ctx.REGISTER()) {
      ReportDielUserError(`You cannot register an input relation`);
    }
    const relationType = ctx.EVENT()
      ? RelationType.EventTable
      : ctx.CREATE()
        ? RelationType.Table
        : RelationType.ExistingAndImmutable;
    const name = ctx.IDENTIFIER().text;
    let columns: Column[] = [];

    const v = this.visit(ctx.relationDefintion());
    if (typeof v === "string") {
      const copyFrom = v as string;
      return {
        constraints: NewRelationConstraints(),
        relationType,
        rName: name,
        columns,
        copyFrom
      };

    } else {
      columns = (v as OriginalRelation).columns;
      const constraints = (v as OriginalRelation).constraints;
      return {
        relationType,
        rName: name,
        columns,
        constraints,
      };
    }

  }

  visitRelationDefintionDirect(ctx: parser.RelationDefintionDirectContext): OriginalRelation {
    const columns = ctx.columnDefinition()
      ? ctx.columnDefinition().map(e => this.visit(e) as Column)
      : [];
    const constraints = this._processConstraintDefinitionHelper(ctx.constraintDefinition());
    // name and relationType are dummy to avoid having to add more to the union type...
    return {
      rName: "",
      relationType: RelationType.Table, // place holder!
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
      const expr = e.expr();
      if (e.PRIMARY()) {
        primaryKey = e.IDENTIFIER().map(i => i.text);
      } else if (e.UNIQUE()) {
        const aUnique = e.IDENTIFIER().map(i => i.text);
        uniques.push(aUnique);
      } else if (e.NULL()) {
        notNull.push(e.IDENTIFIER()[0].text);
      } else if (e.CHECK() && expr) {
        exprChecks.push(this.visit(expr) as ExprAst);
      } else if (e.FOREIGN()) {
        const sourceColumn = e._column.text;
        const targetRelation = e._table.text;
        const targetColumn = e._otherColumn.text;
        if (sourceColumn && targetRelation && targetColumn) {
          foreignKeys.push({
            sourceColumn,
            targetRelation,
            targetColumn,
          });
        } else {
          ReportDielUserError(`Foreign keys must be defined`);
        }
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

  visitColumnDefinition(ctx: parser.ColumnDefinitionContext): Column | null {
    let constraints: ColumnConstraints = {
      autoincrement: false,
      notNull: false,
      unique: false,
      primaryKey: false
    };
    ctx.columnConstraints().map(e => {
      if (e.UNIQUE()) {
        constraints.unique = true;
      }
      if (e.KEY()) {
        constraints.primaryKey = true;
      }
      if (e.NULL()) {
        constraints.notNull = true;
      }
      if (e.AUTOINCREMENT()) {
        constraints.autoincrement = true;
      }
    });
    let defaultValue: any = null;
    if (ctx.DEFAULT()) {
      if (ctx._function) {
        const functionReference = ctx._function.text;
        const args = ctx.value().map(e => this.visit(e) as ExprAst);
        // think about a more elegant comparison
        defaultValue = {
          exprType: ExprType.Func,
          functionType: FunctionType.Custom,
          functionReference,
          args
        };
      } else {
        // this is a single value
        defaultValue = this.visit(ctx._singleValue) as ExprAst;
      }
    }
    const cName = ctx._columnName.text;
    if (!cName) {
      return ReportDielUserError(`Column name must be specified`);
    }
    return {
      cName,
      dataType: parseColumnType(ctx.dataType().text),
      constraints,
      defaultValue
    };
  }

  // programs
  visitProgramStmt(ctx: parser.ProgramStmtContext): ProgramsParserIr {
    const events = ctx.IDENTIFIER().map(n => n.text);
    const queries = this.visit(ctx.programBody()) as Command[];
    return {
      events,
      queries
    };
  }
  // visitProgramStmtGeneral(ctx: parser.ProgramStmtGeneralContext): ProgramsParserIr {
  //   const queries = this.visit(ctx.programBody()) as Command[];
  //   return {
  //     input: null,
  //     queries
  //   };
  // }

  // visitProgramStmtSpecific(ctx: parser.ProgramStmtSpecificContext): ProgramsParserIr {
  //   const input = ctx.IDENTIFIER().text;
  //   const queries = this.visit(ctx.programBody()) as Command[];
  //   return {
  //     input,
  //     queries
  //   };
  // }

  visitProgramBody(ctx: parser.ProgramBodyContext): Command[] {
    const programs = [];
    const rawPrograms = ctx.aProgram();
    for (let i = 0; i < rawPrograms.length; i++) {
      const e = rawPrograms[i];
      const iQuery = e.insertQuery();
      const sQuery = e.selectQuery();
      const dStmt = e.deleteStmt();
      if (iQuery) {
        programs.push(this.visit(iQuery) as InsertionClause);
      } else if (sQuery) {
        programs.push(this.visit(sQuery) as RelationSelection);
      } else if (dStmt) {
        programs.push(this.visit(dStmt) as DeleteClause);
      } else {
        LogInternalError(`Unhandled command`);
      }
    }
    return programs;
  }

  visitInsertQuery(ctx: parser.InsertQueryContext): InsertionClause {
    const identifiers = ctx.IDENTIFIER().map(e => e.text);
    const relation = identifiers[0];
    // note that columsn might not be specified
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
  visitCrossfilterStmt(ctx: parser.CrossfilterStmtContext): CrossFilterIr | null {
    const crossfilter = ctx._crossfilterName.text;
    const relation = ctx._relation.text;
    const charts = ctx.crossfilterChartStmt().map(c => this.visit(c) as CrossFilterChartIr);
    if (crossfilter && relation) {
      return {
        crossfilter,
        relation,
        charts
      };
    }
    return ReportDielUserError(`Crosffilter must speficy`);
  }

  visitCrossfilterChartStmt(ctx: parser.CrossfilterChartStmtContext): CrossFilterChartIr | null {
    const chartName = ctx._chart.text;
    const selection = this.visit(ctx._definitionQuery) as RelationSelection;
    const predicate = this.visit(ctx._predicateClause) as JoinAst;
    if (chartName) {
      return {
        chartName,
        selection,
        predicate
      };
    }
    return ReportDielUserError(`Crosffilter must speficy chart name`);
  }
}