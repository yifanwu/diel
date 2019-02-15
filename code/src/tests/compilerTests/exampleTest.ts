// import { getDielIr } from "../../lib/cli-compiler";
import { GenerateUnitTestErrorLogger, LogInfo } from "../../lib/messages";
import { DataType } from "../../parser/dielAstTypes";

import { ANTLRInputStream, CommonTokenStream } from "antlr4ts";
import * as lexer from "../../parser/grammar/DIELLexer";
import * as parser from "../../parser/grammar/DIELParser";

import DielCompiler from "../../compiler/DielCompiler";
import {generateCompositeSelectionUnit, generateSelect, generateSelectionUnit, generateViewConstraintSelection} from "../../compiler/codegen/codeGenSql";
import { DielConfig, DielAst, RelationConstraints, DerivedRelation } from "../../parser/dielAstTypes";
import Visitor from "../../parser/generateAst";
import {ExprAst, ExprParen, ExprColumnAst, ExprValAst, ExprType, FunctionType, BuiltInFunc, ExprBase, ExprFunAst} from "../../parser/exprAstTypes";
import {SelectionUnit, SetOperator, RelationReference, RelationSelection, ColumnSelection, CompositeSelection} from "../../parser/sqlAstTypes";

import {not_null1, not_null2} from "./null_constraint_input";
import {check1, check2, check3} from "./check_constraint_input";

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

  const logger = GenerateUnitTestErrorLogger("assertExampleTest", check3);
  let ast = checkValidView(check3);
  // console.log(JSON.stringify(ast.views[0], null, 2));
  // return;
  if ( ast != null) {
    // valid view
    checkViewConstraint(ast);
  } else {
    console.log("no view statement");
  }
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
  // console.log(JSON.stringify(ast.views[0].selection, null, 2));
  if (ast.views.length > 0) {
    return ast;
  }
  return null;
}

// Precondition: query is a valid view statement
// supports only a single relation in view
function checkViewConstraint(ast: DielAst) {
  var i, j;
  // Handling multiple view statements
  for ( i = 0; i < ast.views.length; i++) {
    let view = ast.views[i];
    let view_constraint = view.constraints;
    var ret = [] as string[];

    // Only when there is a constraint on view
    if (view_constraint != null) {
      var composite_selections = view.selection.compositeSelections;
      // console.log(generateSelect(composite_selections));
      // console.log(JSON.stringify(baseRelation, null, 2));

      /* Handle multiple table relations later*/
      // 1. handle null constraint
      var selClause = getSelectClauseAST(composite_selections);
      var nullQueries = getNullQuery(view_constraint, selClause);
      ret = ret.concat(nullQueries);

        // // 2. handle unique constraint
        // var uniqueQueries = getUniqueQuery(view_constraint, baseRelation);
        // ret = ret.concat(uniqueQueries);

      // 3. handle check constraint
      selClause = getSelectClauseAST(composite_selections);
      var checkQueries = getCheckQuery(view_constraint, selClause);
      ret = ret.concat(checkQueries);


    }

    ret.map(function(query) {
      console.log("\nQUERY:\n", query);
    });
  }
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





