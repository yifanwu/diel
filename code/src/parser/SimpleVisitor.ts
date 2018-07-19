import { AbstractParseTreeVisitor } from "antlr4ts/tree";
import * as parser from "./grammar/DIELParser";
import * as visitor from "./grammar/DIELVisitor";

import { CombinedResult, ExpressionValue, RelationInfo } from "./dielTypes";
import { getCtxSourceCode } from "./compilerHelper";

/*
 * BASIC SPEC
 * The goal of this visitor is two fold
 * - create the SQL strings to execute (at different places)
 * - create the helper functions to pass the view results
 * - create helper functions for ajax calls to remote servers
 */

export default class SimpleVisitor extends AbstractParseTreeVisitor<ExpressionValue>
implements visitor.DIELVisitor<ExpressionValue> {
  private result: CombinedResult;

  defaultResult() {
    return "";
  }
  visitQueries = (ctx: parser.QueriesContext) => {
    // should only be called once and executed for setup.
    this.result = {
      relations: []
    };
    let qs = ctx.query();
    qs.forEach(e => {
      // console.log("subclause visit", e);
      this.visit(e);
    });
    return this.result;
  }
  
  visitQuery = (ctx: parser.QueryContext) => {
    console.log("processing", getCtxSourceCode);
    let queryInfo: RelationInfo = {
      name: 
    };
    let term = ctx.queryTerm();
    let organization = ctx.queryOrganization();
    // nothing really needs to be returned here since its mostly side-effects to class variables
    return "";
  }
  visitQueryTerm = (ctx: parser.QueryTermContext) => {
    
  }
}