// Generated from src/parser/grammar/DIEL.g4 by ANTLR 4.6-SNAPSHOT


import { ParseTreeVisitor } from 'antlr4ts/tree/ParseTreeVisitor';

import { RelationDefintionCopyContext } from './DIELParser';
import { RelationDefintionDirectContext } from './DIELParser';
import { ExprNullContext } from './DIELParser';
import { ExprNotNullContext } from './DIELParser';
import { ExprBinOpContext } from './DIELParser';
import { ExprExistContext } from './DIELParser';
import { ExprSimpleContext } from './DIELParser';
import { ExprFunctionContext } from './DIELParser';
import { ExprInContext } from './DIELParser';
import { ExprConcatContext } from './DIELParser';
import { ExprNegateContext } from './DIELParser';
import { ExprParenthesisContext } from './DIELParser';
import { ExprWhenContext } from './DIELParser';
import { ValueBooleanContext } from './DIELParser';
import { ValueNumberContext } from './DIELParser';
import { ValueStringContext } from './DIELParser';
import { UnitExprColumnContext } from './DIELParser';
import { UnitExprSubQueryContext } from './DIELParser';
import { UnitExprValueContext } from './DIELParser';
import { RelationReferenceSubQueryContext } from './DIELParser';
import { RelationReferenceSimpleContext } from './DIELParser';
import { JoinClauseTemplateContext } from './DIELParser';
import { JoinClauseBasicContext } from './DIELParser';
import { InsertBodyDirectContext } from './DIELParser';
import { InsertBodySelectContext } from './DIELParser';
import { SelectQueryDirectContext } from './DIELParser';
import { SelectQueryTemplateContext } from './DIELParser';
import { QueriesContext } from './DIELParser';
import { RegisterTypeUdfContext } from './DIELParser';
import { TemplateStmtContext } from './DIELParser';
import { DataTypeContext } from './DIELParser';
import { ColumnDefinitionContext } from './DIELParser';
import { ConstraintDefinitionContext } from './DIELParser';
import { OriginalTableStmtContext } from './DIELParser';
import { RelationDefintionContext } from './DIELParser';
import { ConstraintClauseContext } from './DIELParser';
import { ColumnConstraintsContext } from './DIELParser';
import { ViewStmtContext } from './DIELParser';
import { ProgramStmtContext } from './DIELParser';
import { ProgramBodyContext } from './DIELParser';
import { AProgramContext } from './DIELParser';
import { SelectQueryContext } from './DIELParser';
import { TemplateQueryContext } from './DIELParser';
import { DropQueryContext } from './DIELParser';
import { DeleteStmtContext } from './DIELParser';
import { VariableAssignmentContext } from './DIELParser';
import { CompositeSelectContext } from './DIELParser';
import { SetOpContext } from './DIELParser';
import { SelectUnitQueryContext } from './DIELParser';
import { WhereClauseContext } from './DIELParser';
import { GroupByClauseContext } from './DIELParser';
import { HavingClauseContext } from './DIELParser';
import { OrderByClauseContext } from './DIELParser';
import { OrderSpecContext } from './DIELParser';
import { InsertQueryContext } from './DIELParser';
import { InsertBodyContext } from './DIELParser';
import { JoinClauseContext } from './DIELParser';
import { LimitClauseContext } from './DIELParser';
import { RelationReferenceContext } from './DIELParser';
import { ExprContext } from './DIELParser';
import { UnitExprContext } from './DIELParser';
import { SelectColumnClauseContext } from './DIELParser';
import { ValueContext } from './DIELParser';
import { MathOpContext } from './DIELParser';
import { CompareOpContext } from './DIELParser';
import { LogicOpContext } from './DIELParser';


/**
 * This interface defines a complete generic visitor for a parse tree produced
 * by `DIELParser`.
 *
 * @param <Result> The return type of the visit operation. Use `void` for
 * operations with no return type.
 */
export interface DIELVisitor<Result> extends ParseTreeVisitor<Result> {
	/**
	 * Visit a parse tree produced by the `relationDefintionCopy`
	 * labeled alternative in `DIELParser.relationDefintion`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitRelationDefintionCopy?: (ctx: RelationDefintionCopyContext) => Result;

	/**
	 * Visit a parse tree produced by the `relationDefintionDirect`
	 * labeled alternative in `DIELParser.relationDefintion`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitRelationDefintionDirect?: (ctx: RelationDefintionDirectContext) => Result;

	/**
	 * Visit a parse tree produced by the `exprNull`
	 * labeled alternative in `DIELParser.expr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitExprNull?: (ctx: ExprNullContext) => Result;

	/**
	 * Visit a parse tree produced by the `exprNotNull`
	 * labeled alternative in `DIELParser.expr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitExprNotNull?: (ctx: ExprNotNullContext) => Result;

	/**
	 * Visit a parse tree produced by the `exprBinOp`
	 * labeled alternative in `DIELParser.expr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitExprBinOp?: (ctx: ExprBinOpContext) => Result;

	/**
	 * Visit a parse tree produced by the `exprExist`
	 * labeled alternative in `DIELParser.expr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitExprExist?: (ctx: ExprExistContext) => Result;

	/**
	 * Visit a parse tree produced by the `exprSimple`
	 * labeled alternative in `DIELParser.expr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitExprSimple?: (ctx: ExprSimpleContext) => Result;

	/**
	 * Visit a parse tree produced by the `exprFunction`
	 * labeled alternative in `DIELParser.expr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitExprFunction?: (ctx: ExprFunctionContext) => Result;

	/**
	 * Visit a parse tree produced by the `exprIn`
	 * labeled alternative in `DIELParser.expr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitExprIn?: (ctx: ExprInContext) => Result;

	/**
	 * Visit a parse tree produced by the `exprConcat`
	 * labeled alternative in `DIELParser.expr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitExprConcat?: (ctx: ExprConcatContext) => Result;

	/**
	 * Visit a parse tree produced by the `exprNegate`
	 * labeled alternative in `DIELParser.expr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitExprNegate?: (ctx: ExprNegateContext) => Result;

	/**
	 * Visit a parse tree produced by the `exprParenthesis`
	 * labeled alternative in `DIELParser.expr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitExprParenthesis?: (ctx: ExprParenthesisContext) => Result;

	/**
	 * Visit a parse tree produced by the `exprWhen`
	 * labeled alternative in `DIELParser.expr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitExprWhen?: (ctx: ExprWhenContext) => Result;

	/**
	 * Visit a parse tree produced by the `valueBoolean`
	 * labeled alternative in `DIELParser.value`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitValueBoolean?: (ctx: ValueBooleanContext) => Result;

	/**
	 * Visit a parse tree produced by the `valueNumber`
	 * labeled alternative in `DIELParser.value`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitValueNumber?: (ctx: ValueNumberContext) => Result;

	/**
	 * Visit a parse tree produced by the `valueString`
	 * labeled alternative in `DIELParser.value`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitValueString?: (ctx: ValueStringContext) => Result;

	/**
	 * Visit a parse tree produced by the `unitExprColumn`
	 * labeled alternative in `DIELParser.unitExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitUnitExprColumn?: (ctx: UnitExprColumnContext) => Result;

	/**
	 * Visit a parse tree produced by the `unitExprSubQuery`
	 * labeled alternative in `DIELParser.unitExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitUnitExprSubQuery?: (ctx: UnitExprSubQueryContext) => Result;

	/**
	 * Visit a parse tree produced by the `unitExprValue`
	 * labeled alternative in `DIELParser.unitExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitUnitExprValue?: (ctx: UnitExprValueContext) => Result;

	/**
	 * Visit a parse tree produced by the `relationReferenceSubQuery`
	 * labeled alternative in `DIELParser.relationReference`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitRelationReferenceSubQuery?: (ctx: RelationReferenceSubQueryContext) => Result;

	/**
	 * Visit a parse tree produced by the `relationReferenceSimple`
	 * labeled alternative in `DIELParser.relationReference`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitRelationReferenceSimple?: (ctx: RelationReferenceSimpleContext) => Result;

	/**
	 * Visit a parse tree produced by the `joinClauseTemplate`
	 * labeled alternative in `DIELParser.joinClause`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitJoinClauseTemplate?: (ctx: JoinClauseTemplateContext) => Result;

	/**
	 * Visit a parse tree produced by the `joinClauseBasic`
	 * labeled alternative in `DIELParser.joinClause`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitJoinClauseBasic?: (ctx: JoinClauseBasicContext) => Result;

	/**
	 * Visit a parse tree produced by the `insertBodyDirect`
	 * labeled alternative in `DIELParser.insertBody`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitInsertBodyDirect?: (ctx: InsertBodyDirectContext) => Result;

	/**
	 * Visit a parse tree produced by the `insertBodySelect`
	 * labeled alternative in `DIELParser.insertBody`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitInsertBodySelect?: (ctx: InsertBodySelectContext) => Result;

	/**
	 * Visit a parse tree produced by the `selectQueryDirect`
	 * labeled alternative in `DIELParser.selectQuery`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitSelectQueryDirect?: (ctx: SelectQueryDirectContext) => Result;

	/**
	 * Visit a parse tree produced by the `selectQueryTemplate`
	 * labeled alternative in `DIELParser.selectQuery`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitSelectQueryTemplate?: (ctx: SelectQueryTemplateContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.queries`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitQueries?: (ctx: QueriesContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.registerTypeUdf`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitRegisterTypeUdf?: (ctx: RegisterTypeUdfContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.templateStmt`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitTemplateStmt?: (ctx: TemplateStmtContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.dataType`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitDataType?: (ctx: DataTypeContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.columnDefinition`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitColumnDefinition?: (ctx: ColumnDefinitionContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.constraintDefinition`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitConstraintDefinition?: (ctx: ConstraintDefinitionContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.originalTableStmt`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitOriginalTableStmt?: (ctx: OriginalTableStmtContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.relationDefintion`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitRelationDefintion?: (ctx: RelationDefintionContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.constraintClause`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitConstraintClause?: (ctx: ConstraintClauseContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.columnConstraints`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitColumnConstraints?: (ctx: ColumnConstraintsContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.viewStmt`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitViewStmt?: (ctx: ViewStmtContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.programStmt`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitProgramStmt?: (ctx: ProgramStmtContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.programBody`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitProgramBody?: (ctx: ProgramBodyContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.aProgram`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitAProgram?: (ctx: AProgramContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.selectQuery`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitSelectQuery?: (ctx: SelectQueryContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.templateQuery`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitTemplateQuery?: (ctx: TemplateQueryContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.dropQuery`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitDropQuery?: (ctx: DropQueryContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.deleteStmt`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitDeleteStmt?: (ctx: DeleteStmtContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.variableAssignment`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitVariableAssignment?: (ctx: VariableAssignmentContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.compositeSelect`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitCompositeSelect?: (ctx: CompositeSelectContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.setOp`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitSetOp?: (ctx: SetOpContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.selectUnitQuery`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitSelectUnitQuery?: (ctx: SelectUnitQueryContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.whereClause`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitWhereClause?: (ctx: WhereClauseContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.groupByClause`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitGroupByClause?: (ctx: GroupByClauseContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.havingClause`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitHavingClause?: (ctx: HavingClauseContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.orderByClause`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitOrderByClause?: (ctx: OrderByClauseContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.orderSpec`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitOrderSpec?: (ctx: OrderSpecContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.insertQuery`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitInsertQuery?: (ctx: InsertQueryContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.insertBody`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitInsertBody?: (ctx: InsertBodyContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.joinClause`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitJoinClause?: (ctx: JoinClauseContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.limitClause`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitLimitClause?: (ctx: LimitClauseContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.relationReference`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitRelationReference?: (ctx: RelationReferenceContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.expr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitExpr?: (ctx: ExprContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.unitExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitUnitExpr?: (ctx: UnitExprContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.selectColumnClause`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitSelectColumnClause?: (ctx: SelectColumnClauseContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.value`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitValue?: (ctx: ValueContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.mathOp`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitMathOp?: (ctx: MathOpContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.compareOp`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitCompareOp?: (ctx: CompareOpContext) => Result;

	/**
	 * Visit a parse tree produced by `DIELParser.logicOp`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitLogicOp?: (ctx: LogicOpContext) => Result;
}

