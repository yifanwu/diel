import { DataType } from "../../parser/dielAstTypes";

import { ANTLRInputStream, CommonTokenStream } from "antlr4ts";
import * as lexer from "../../parser/grammar/DIELLexer";
import * as parser from "../../parser/grammar/DIELParser";

import DielCompiler from "../../compiler/DielCompiler";
import {generateCompositeSelectionUnit, generateSelect, generateSelectionUnit, generateViewConstraintSelection} from "../../compiler/codegen/codeGenSql";
import { DielConfig, DielAst, RelationConstraints, DerivedRelation } from "../../parser/dielAstTypes";
import Visitor from "../../parser/generateAst";
import {ExprAst, ExprParen, ExprColumnAst, ExprValAst, ExprType, FunctionType, BuiltInFunc, ExprBase, ExprFunAst} from "../../parser/exprAstTypes";
import {GroupByAst, SelectionUnit, SetOperator, RelationReference, RelationSelection, ColumnSelection, CompositeSelection} from "../../parser/sqlAstTypes";

export function generateViewConstraintCheckQuery(query: string): string[][] {
  let ast = checkValidView(query);
  if ( ast != null) {
    // valid view
    return checkViewConstraint(ast);
  }
  return null;
}

/** Check if this is a valid view query. Return ast if it is, or null. */
function checkValidView(query: string): DielAst {
  const inputStream = new ANTLRInputStream(query);
  const l = new lexer.DIELLexer(inputStream);
  const tokenStream = new CommonTokenStream(l);
  const p = new parser.DIELParser(tokenStream);
  const tree = p.queries();
  let visitor = new Visitor();
  let ast = visitor.visitQueries(tree);
  if (ast.views.length > 0) {
    return ast;
  }
  return null;
}

// Precondition: query is a valid view statement
// supports only a single relation in view
function checkViewConstraint(ast: DielAst): string[][] {
  var i, j;
  var ret = [] as string[][];
  // Handling multiple view statements
  for ( i = 0; i < ast.views.length; i++) {
    let view = ast.views[i];
    let view_constraint = view.constraints;
    var queries = [] as string[];
    var selClause;
    // Only when there is a constraint on view
    if (view_constraint != null) {
      var composite_selections = view.selection.compositeSelections;

      // 1. handle null constraint
      selClause = getSelectClauseAST(composite_selections);
      var nullQueries = getNullQuery(view_constraint, selClause);
      queries = queries.concat(nullQueries);

      // 2. handle unique constraint
      selClause = getSelectClauseAST(composite_selections);
      var uniqueQueries = getUniqueQuery(view_constraint, selClause);
      queries = queries.concat(uniqueQueries);

      // 3. handle check constraint
      selClause = getSelectClauseAST(composite_selections);
      var checkQueries = getCheckQuery(view_constraint, selClause);
      queries = queries.concat(checkQueries);
    }

    // queries.map(function(query) {
    //   console.log(`====================================\n`, query
    //   , `\n====================================\n`);
    // });
    ret.push(queries);
  }
  return ret;
}

function getSelectClauseAST(fromSel: CompositeSelection): SelectionUnit {
    var columnSel = {} as ColumnSelection;
    columnSel.expr = {
      exprType: ExprType.Column,
      dataType: DataType.TBD,
      hasStar: true
    } as ExprAst;

    var baseRelation = {
      subquery: {
        compositeSelections: fromSel
      } as RelationSelection
    } as RelationReference;

    var selUnit;
    selUnit = {
      columnSelections: [columnSel],
      baseRelation: baseRelation,
      derivedColumnSelections: [],
      joinClauses: [],
      groupByClause: null,
      orderByClause: null,
      limitClause: null
    } as SelectionUnit;
    return selUnit;
}

function getCheckQuery(view_constraint: RelationConstraints, selUnit: SelectionUnit): string[] {
  var exprAsts = view_constraint.exprChecks;
  var ret = [] as string[];
  if (exprAsts != null && exprAsts.length > 0) {
    var i, exprAst, whereClause;
    // iterate over check constraints
    for (i = 0; i < exprAsts.length; i++) {
      // ast for where clause
      exprAst = exprAsts[i] as ExprParen;

      whereClause = {
        exprType: ExprType.Func,
        dataType: DataType.Boolean,
        functionType: FunctionType.Custom,
        functionReference: "NOT",
        args: [exprAst.content] // strip out parenthesis
      } as ExprFunAst;

      // ast for the whole clause
      selUnit.whereClause = whereClause;

      var str = generateViewConstraintSelection(selUnit);
      ret.push(str);
    }
  }
  return ret;
}


function getNullQuery(view_constraint: RelationConstraints, selUnit: SelectionUnit): string[] {
  // console.log(JSON.stringify(view_constraint, null, 2));
  var ret = [] as string[];
  if (view_constraint.notNull != null && view_constraint.notNull.length > 0) {
    var notNullColumns = view_constraint.notNull;

    // formating the AST for whereclause
      var whereClause = {
        exprType : ExprType.Func,
        dataType : DataType.Boolean,
        functionType : FunctionType.BuiltIn,
        functionReference : BuiltInFunc.ValueIsNull,
        args : [] as ExprValAst[]
      } as ExprFunAst;

    // Handle multiple null constraints
    // format argument AST
      var whereClauseArg;
      notNullColumns.map(function(cname) {
        whereClauseArg = {
          exprType: ExprType.Column,
          dataType: DataType.TBD,
          hasStar: false,
          columnName: cname
        } as ExprColumnAst;
        whereClause.args.push(whereClauseArg);
      });
      // console.log(whereClause);

      // formatting the rest of the selection unit for Not NULl
      selUnit.whereClause = whereClause;

      // Generate proper query from AST
      var str = generateViewConstraintSelection(selUnit);
      ret.push(str);
  }
  return ret;
}

function getUniqueQuery (view_constraints: RelationConstraints, selUnit: SelectionUnit): string[] {
  var ret = [] as string[];
  // console.log(view_constraints.uniques);
  let uniques = view_constraints.uniques;

  // check if unique constraint exists
  if (uniques !== null && uniques.length > 0) {
    var str, i, j, groupbyArgs, groupbyColName, groupByClause, groupbySel, predicateSel;
    for (i = 0; i < uniques.length; i++) {
      groupbyArgs = uniques[i];
      for (j = 0; j < groupbyArgs.length; j++) {
        groupbyColName = groupbyArgs[j];

        // format groupby AST
        // which coloum to group by
        groupbySel = {
            exprType: ExprType.Column,
            dataType: DataType.TBD,
            hasStar: false,
            columnName: groupbyColName
          } as ExprColumnAst;

        // format having clause AST
        predicateSel = {
          exprType: ExprType.Func,
          functionType: FunctionType.Logic,
          functionReference: ">",
          dataType: DataType.Boolean,
          args : [
            {
              exprType: ExprType.Func,
              dataType: DataType.TBD,
              functionType: FunctionType.Custom,
              functionReference: "COUNT",
              args: [
                {
                  exprType: ExprType.Column,
                  dataType: DataType.TBD,
                  hasStar: true,
                  columnName: groupbyColName
                }]
            },
            {
              exprType: ExprType.Val,
              dataType: DataType.Number,
              value: 1
            } as ExprValAst
          ] as ExprAst[]
        } as ExprFunAst;

        // format the whole groupby clause AST
        groupByClause = {
          selections: [groupbySel] as ExprAst[],
          predicate: predicateSel
        } as GroupByAst;


        selUnit.groupByClause = groupByClause;
        // change selUnit select clause
        selUnit.columnSelections = [
          {
              expr: {
                exprType: ExprType.Column,
                dataType: DataType.TBD,
                hasStar: false,
                columnName: groupbyColName
              }
          },
          {
              expr: {
                exprType: ExprType.Func,
                dataType: DataType.TBD,
                functionType: FunctionType.Custom,
                functionReference: "COUNT",
                args: [
                  {
                    exprType: ExprType.Column,
                    dataType: DataType.TBD,
                    hasStar: true
                  }
                ]
              }
          }
        ] as ColumnSelection[];

        // Generate proper query from AST
        str = generateViewConstraintSelection(selUnit);
        ret.push(str);
      }
    }
  }
  return ret;
}





