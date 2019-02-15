// import { getDielIr } from "../../lib/cli-compiler";
import { GenerateUnitTestErrorLogger, LogInfo } from "../../lib/messages";
import { DataType } from "../../parser/dielAstTypes";

import { ANTLRInputStream, CommonTokenStream } from "antlr4ts";
import * as lexer from "../../parser/grammar/DIELLexer";
import * as parser from "../../parser/grammar/DIELParser";

import DielCompiler from "../../compiler/DielCompiler";
import {generateCompositeSelectionUnit, generateSelectionUnit, generateViewConstraintSelection} from "../../compiler/codegen/codeGenSql";
import { DielConfig, DielAst, RelationConstraints, DynamicRelation, DerivedRelation } from "../../parser/dielAstTypes";
import Visitor from "../../parser/generateAst";
import {ExprAst, ExprParen, ExprValAst, ExprType, FunctionType, BuiltInFunc, ExprBase, ExprFunAst} from "../../parser/exprAstTypes";
import {SelectionUnit, SetOperator, RelationReference, RelationSelection, ColumnSelection, CompositeSelectionUnit} from "../../parser/sqlAstTypes";

const groupby = `
create view t as select day as x, count(day) as y
from flights
group by day;`;

const mult_table = `create view v2 as select t2.* from t join t2 on t.a = t2.a
constrain a1 NOT NULL, a2 NOT NULL;`;

const no_view_q = `CREATE TABLE t1 (
  a1 INTEGER PRIMARY KEY,
  a2 INTEGER NOT NULL);
  insert into t1 (a1, a2) values (100, 120);`;
const no_constraint_q = `CREATE TABLE t1 (
    a1 INTEGER PRIMARY KEY,
    a2 INTEGER NOT NULL);
    insert into t1 (a1, a2) values (100, 120);
    create view filtered_view as select a1 from t1 where a > 10;`;

const nested_select_q = `create view filtered_vew as
select * from
(select a1 from t1);`;


export function assertExampleTest() {
  const q = `
  create view filtered_view as select a1, a2 from t1 where not a1 < 10;`;
  // constrain UNIQUE (a1, a2), a1 NOT NULL, UNIQUE(a3), a2 NOT NULL, CHECK (a1 < 10), CHECK (a2 > 100);
  // `;

  const logger = GenerateUnitTestErrorLogger("assertExampleTest", q);
  let ast = checkValidView(q);
  console.log(ast);
  return;
  if ( ast != null) {
    // valid view
    checkViewConstraint(ast);
  } else {
    console.log("no view statement");
  }
}

function checkValidView(query: string): DielAst {
  const inputStream = new ANTLRInputStream(query);
  const l = new lexer.DIELLexer(inputStream);
  const tokenStream = new CommonTokenStream(l);
  const p = new parser.DIELParser(tokenStream);
  const tree = p.queries();
  let visitor = new Visitor();
  let ast = visitor.visitQueries(tree);
  // console.log(JSON.stringify(ast.views[0].selection, null, 2));
  if (ast.views.length > 0) {
    return ast;
  }
  return null;
}

// Precondition: query is a valid view statement
// supports only a single relation in view
function checkViewConstraint(ast: DielAst) {
  // Modify later: should iterate this when have multiple views.
  // Also should match their table name when multiple relations in a view.
  var i, j;
  for ( i = 0; i < ast.views.length; i++) {
    let view = ast.views[i];
    let view_constraint = view.constraints;
    var ret = [] as string[];

    // Only when there is a constraint on view
    if (view_constraint != null) {
      var composite_selections = view.selection.compositeSelections;
      for (j = 0; j < composite_selections.length; j ++) {
        var selectionUnit = composite_selections[i].relation;
        var baseRelation = {
          subquery: {
            compositeSelections: [{
              op: SetOperator.NA,
              relation: selectionUnit
            }] as CompositeSelectionUnit[]
          } as RelationSelection
        } as RelationReference;
        // console.log(JSON.stringify(selectionUnit.whereClause, null, 2));


        /* Handle multiple table relations later*/
        // 1. handle null constraint
        var nullQueries = getNullQuery(view_constraint, baseRelation);
        ret = ret.concat(nullQueries);

        // 2. handle unique constraint
        var uniqueQueries = getUniqueQuery(view_constraint, baseRelation);
        ret = ret.concat(uniqueQueries);
        // 3. handle check constraint
        var checkQueries = getCheckQuery(view_constraint, baseRelation);
        ret = ret.concat(checkQueries);

      }
    }

    ret.map(function(query) {
      console.log("\nQUERY:\n", query);
    });
  }
}


function getCheckQuery(view_constraint: RelationConstraints, fromSel: RelationReference): string[] {
  var exprAsts = view_constraint.exprChecks;
  var ret = [] as string[];
  if (exprAsts != null && exprAsts.length > 0) {
    var i, negatedAst;
    var exprAst;
    // iterate over check constraints
    for (i = 0; i < exprAsts.length; i++) {
      // ast for where clause
      exprAst = exprAsts[i] as ExprParen;
      negatedAst = {
        exprType: ExprType.Func,
        dataType: DataType.Boolean,
        functionType: FunctionType.BuiltIn,
        functionReference: BuiltInFunc.SetNotEmpty,
        args: [exprAst.content] as ExprAst[]
      } as ExprAst;

      // ast for select clause
      var columnSel = {} as ColumnSelection;
      columnSel.expr = {
        exprType: ExprType.Column,
        dataType: DataType.TBD,
        hasStar: true
      } as ExprAst;

      // ast for the whole clause
      var selUnit;
      selUnit = {
        columnSelections: [columnSel],
        whereClause: negatedAst,
        baseRelation: fromSel,
        derivedColumnSelections: [],
        joinClauses: [],
        groupByClause: null,
        orderByClause: null,
        limitClause: null
      } as SelectionUnit;

      var str = generateViewConstraintSelection(selUnit);
      ret.push(str);
    }
  }
  return ret;
}

function getNullQuery(view_constraint: RelationConstraints, fromSel: RelationReference): string[] {
  // console.log(view_constraints);
  var ret = [] as string[];
      // { exprType: 'Func',
      //   dataType: 'Boolean',
      //   functionType: 'BuiltIn',
      //   functionReference: 'ValueIsNotNull',
      //   args: [Array] }
  if (view_constraint.notNull != null) {
    var whereClauses = [] as ExprFunAst[];

    // formating the ast for where null clause
    view_constraint.notNull.map(function(name) {
      var whereClause = {} as ExprFunAst;
      whereClause.exprType = ExprType.Func;
      whereClause.dataType = DataType.Boolean;
      whereClause.functionType = FunctionType.BuiltIn;
      whereClause.functionReference = BuiltInFunc.ValueIsNotNull;
      whereClause.args = [{
        value: name,
        exprType: ExprType.Val
      } as ExprValAst] as ExprValAst[];

      whereClauses.push(whereClause);
    });
    // formatting the rest of the selection unit for Not NULl
    var columnSel = {} as ColumnSelection;
    columnSel.expr = {
      exprType: ExprType.Column,
      dataType: DataType.TBD,
      hasStar: true
    } as ExprAst;

    var selUnit;
    whereClauses.map(function(where_ast) {

      selUnit = {
        columnSelections: [columnSel],
        whereClause: where_ast,
        baseRelation: fromSel,
        derivedColumnSelections: [],
        joinClauses: [],
        groupByClause: null,
        orderByClause: null,
        limitClause: null
      } as SelectionUnit;
      var str = generateViewConstraintSelection(selUnit);
      ret.push(str);
    });
  }
  return ret;
}

function getUniqueQuery (view_constraints: RelationConstraints, fromSel: RelationReference): string[] {
  // console.log(view_constraints);
  var ret = [] as string[];
  // console.log(view_constraints);
  // let uniques = view_constraints.uniques;

  // if (uniques.length > 0) {
  //   // unique constraint exists
  //   var i, arg, str;
  //   for (i = 0; i < uniques[0].length; i++) {
  //     arg = uniques[0][i];
  //     // use selectionunit instead of String!
  //     // generateSelectionUnitBody
  //     // str = ``.concat(`SELECT `, arg, `, COUNT(*) FROM `, tableNames[0], ` GROUP BY `, arg, ` HAVING COUNT(*) > 1;`);
  //     // query.push(str);
  //   }
  // }


  return ret;
}





