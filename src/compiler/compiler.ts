import { IsRelationTypeDerived } from "./DielAstGetters";
import { ApplyTemplates, TryToApplyTemplate, TryToCopyRelationSpec } from "./passes/applyTemplate";
import { AddDepTree, AddSingleDependencyByDerivedRelation, ArrangeInTopologicalOrder } from "./passes/dependency";
import { NormalizeConstraints, NormalizeConstraintsForSingleOriginalRelation } from "./passes/normalizeConstraints";
import { NormalizeColumnSelection, NormalizeColumnForDerivedRelation } from "./passes/normalizeColumnSelection";
import { InferType, InferTypeForDerivedRelation } from "./passes/inferType";
import { DerivedRelation, OriginalRelation, DielAst } from "../parser/dielAstTypes";
import { AddRelation } from "./DielAstVisitors";
import { NormalizeAlias, NormalizeAliasForDerivedRelation } from "./passes/normalizeAlias";

import { ANTLRInputStream, CommonTokenStream } from "antlr4ts";
import * as parser from "../parser/grammar/DIELParser";
import * as lexer from "../parser/grammar/DIELLexer";
import Visitor from "../parser/generateAst";
import { RelationSelection } from "../parser/dielAstTypes";

export function parse(code: string) {
  const inputStream = new ANTLRInputStream(code);
  const l = new lexer.DIELLexer(inputStream);
  const tokenStream = new CommonTokenStream(l);
  return new parser.DIELParser(tokenStream);
}

export function ParsePlainSelectQueryAst(code: string) {
  const inputStream = new ANTLRInputStream(code);
  const l = new lexer.DIELLexer(inputStream);
  const tokenStream = new CommonTokenStream(l);
  const p = new parser.DIELParser(tokenStream);
  const tree = p.selectQuery();
  let visitor = new Visitor();
  let ast = visitor.visit(tree) as RelationSelection;
  return ast;
}

/**
 * this visits all the queries that are included in the string
 * @param code code string
 */
export function ParsePlainDielAst(code: string) {
  // PrintCode(code);
  const inputStream = new ANTLRInputStream(code);
  const l = new lexer.DIELLexer(inputStream);
  const tokenStream = new CommonTokenStream(l);
  const p = new parser.DIELParser(tokenStream);
  const tree = p.queries();
  let visitor = new Visitor();
  let ast = visitor.visitQueries(tree);
  return ast;
}

/**
 * Note that the compilation here is logical
 * there will be another pass on how to do the phyical part
 * @param ir the IR that will be manipulated
 */
export function CompileAst(ast: DielAst) {
  ApplyTemplates(ast);
  NormalizeAlias(ast);
  AddDepTree(ast);
  ArrangeInTopologicalOrder(ast);
  NormalizeConstraints(ast);
  NormalizeColumnSelection(ast);
  InferType(ast);
  return ast;
}

// there should be a progressive version of this already.
// do not support crossfilter for now, but easy to fix!
export function CompileNewRelationToExistingAst(ast: DielAst, relation: OriginalRelation | DerivedRelation) {
  if (IsRelationTypeDerived(relation.relationType)) {
    CompileDerivedAstGivenAst(ast, relation as DerivedRelation);
  } else {
    CompileOriginalAstGivenIr(ast, relation as OriginalRelation);
  }
}

export function CompileDerivedAstGivenAst(ast: DielAst, view: DerivedRelation) {
  AddRelation(ast, view);
  TryToApplyTemplate(view.selection);
  NormalizeAliasForDerivedRelation(view);
  AddSingleDependencyByDerivedRelation(ast, view);
  NormalizeColumnForDerivedRelation(ast, view);
  InferTypeForDerivedRelation(ast, view);
  return view;
}

/**
 * TODO: we need to handled the original like derived if they have subqueries...
 * @param ast 
 * @param original 
 */
export function CompileOriginalAstGivenIr(ast: DielAst, original: OriginalRelation) {
  TryToCopyRelationSpec(ast, original);
  // TODO: need to add the depends on dependency...
  NormalizeConstraintsForSingleOriginalRelation(original);
  return original;
}