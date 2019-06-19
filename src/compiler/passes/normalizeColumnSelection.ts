import { ReportDielUserError, LogInternalError, DielInternalErrorType } from "../../util/messages";
import { ExprType, ExprColumnAst, SelectionUnit, ColumnSelection, RelationReference, DerivedRelation, DielAst, RelationReferenceType, RelationReferenceDirect, RelationReferenceSubquery, ExprFunAst, ExprStarAst, ExprAst, ExprParen, SimpleColumn, BuiltInColumn, BuiltInColumnDataTypes } from "../../parser/dielAstTypes";
import { WalkThroughSelectionUnits } from "../DielAstVisitors";
import { GetRelationDef, IsRelationEvent, DeriveColumnsFromRelation, DeriveColumnsFromSelectionUnit } from "../DielAstGetters";

/**
 * the pass removes the .* as well as filling in where the columns comes from if it's not specified
 * - visit by topological order
 * - supports subqueries, e.g., select k.* from (select * from t1) k;
 */
export function NormalizeColumnSelection(ast: DielAst) {
  WalkThroughSelectionUnits(ast, normalizeColumnForSelectionUnit);
}


/**
 * Note that if the referenced relation is an event table, the relevant event timesteps will be included
 * @param ast
 * @param ref
 */
function columnsFromRelationReference(ast: DielAst, ref: RelationReference): SimpleColumn[] | null {
  switch (ref.relationReferenceType) {
    case RelationReferenceType.Direct: {
      const r = ref as RelationReferenceDirect;
      const def = GetRelationDef(ast, r.relationName);
      return DeriveColumnsFromRelation(def);
    }
    case RelationReferenceType.Subquery: {
      const r = ref as RelationReferenceSubquery;
      const newSelUnit = r.subquery.compositeSelections[0].relation;
      normalizeColumnForSelectionUnit(newSelUnit, ast);
      return DeriveColumnsFromSelectionUnit(newSelUnit);
    }
    default:
      return LogInternalError(`Case ${ref.relationReferenceType} not handled`, DielInternalErrorType.UnionTypeNotAllHandled);
  }
}

function columnsFromLocalSelectionUnit(ast: DielAst, s: SelectionUnit, refName: string): SimpleColumn[] | null {

  if (refName === s.baseRelation.alias) {
    const baseResult = columnsFromRelationReference(ast, s.baseRelation);
    if (baseResult) return baseResult;
  }
  if (s.joinClauses) {
    for (let i = 0; i < s.joinClauses.length; i ++) {
      const joinRef = s.joinClauses[i];
      if (refName === joinRef.relation.alias) {
        const joinResult = columnsFromRelationReference(ast, joinRef.relation);
        if (joinResult) {
          return joinResult;
        }
      }
    }
  }

  return ReportDielUserError(`Relation not defined`);
}

function starCase(ast: DielAst, s: SelectionUnit, currentColumnExpr: ExprStarAst): ExprAst[] {
  // both of the following options will need to append to the selections
  if (currentColumnExpr.relationName) {
    // case 1: find the columns of just the relations specified
    const populatedColumns = columnsFromLocalSelectionUnit(ast, s, currentColumnExpr.relationName)
      .map(newColumn => ({
          exprType: ExprType.Column,
          dataType: newColumn.dataType,
          hasStar: false,
          columnName: newColumn.cName,
          relationName: currentColumnExpr.relationName
      }));
    return populatedColumns;
  } else {
    // case 2: find all the relations
    const populatedColumnsFromBase: ExprColumnAst[] = columnsFromRelationReference(ast, s.baseRelation)
      .map(newColumn => ({
        exprType: ExprType.Column,
        dataType: newColumn.dataType,
        columnName: newColumn.cName,
        relationName: s.baseRelation.alias
      }));
    let populatedColumnsFromJoins: ExprColumnAst[] = [];
    s.joinClauses.map(j => {
      const relationName = j.relation.alias;
      const newColumns: ExprColumnAst[] = columnsFromRelationReference(ast, j.relation).map(c => ({
        exprType: ExprType.Column,
        columnName: c.cName,
        relationName: relationName,
      }));
      populatedColumnsFromJoins.push(...newColumns);
    });
    return populatedColumnsFromBase.concat(populatedColumnsFromJoins);
  }
}

export function NormalizeColumnForDerivedRelation(ast: DielAst, view: DerivedRelation) {
  view.selection.compositeSelections.map(s => {
    normalizeColumnForSelectionUnit(s.relation, ast);
  });
}

function normalizeRelationReference(ref: RelationReference, ast: DielAst, rName?: string) {
  if (ref.relationReferenceType === RelationReferenceType.Subquery) {
    const r = ref as RelationReferenceSubquery;
    normalizeColumnForSelectionUnit(r.subquery.compositeSelections[0].relation, ast, rName);
  }
}

/**
 * modify in place : (
 * @param s
 * @param ast
 * @param rName optional, used for providing informative error messages.
 */
function normalizeColumnForSelectionUnit(s: SelectionUnit, ast: DielAst, rName?: string): void {
  console.log("normalized column for ", rName);
  if (s.derivedColumnSelections) {
    // not an error
    return;
  }
  // 1. let's first deal with the subqueries
  if (s.baseRelation) {
    normalizeRelationReference(s.baseRelation, ast, rName);
    if (s.joinClauses) {
      s.joinClauses.map(j => {
        normalizeRelationReference(j.relation, ast, rName);
      });
    }
  }
  // 2. then the actual selections
  const derivedColumnSelections: ColumnSelection[] = [];
  for (let i = 0; i < s.columnSelections.length; i ++) {
    const c = s.columnSelections[i];
    const exprs = normalizeExpr(ast, s, c.expr);
    if (exprs.length === 0) {
      LogInternalError(`exprs should at least be 1`);
      return;
    } else if (exprs.length === 1) {
      derivedColumnSelections.push({
        expr: exprs[0],
        alias: c.alias
      });
    } else {
      // this must be the star case
      // if the stars were all named
      for (let j = 0; j < exprs.length; j ++) {
        const expr = exprs[j];
        if (expr.exprType !== ExprType.Column) {
          LogInternalError(`Only columns should be expanded`);
        }
        const cE = expr as ExprColumnAst;
        // if there is just one relation, we shouldn't...
        // we can potentially look into improving the experience by omitting the join?
        // const alias = cE.columnName;
        const alias = (s.joinClauses.length === 0) || (s.columnSelections.filter(s => s.expr.exprType === ExprType.Star).length === 1)
          ? cE.columnName
          : `${cE.relationName}_${cE.columnName}`;
        derivedColumnSelections.push({
          expr,
          alias
        });
      }
    }
  }
  s.derivedColumnSelections = derivedColumnSelections;
  return;
}

function normalizeExpr(ast: DielAst, s: SelectionUnit, e: ExprAst): ExprAst[] {
  switch (e.exprType) {
    case ExprType.Star: {
      return starCase(ast, s, e as ExprStarAst);
    }
    case ExprType.Column: {
      return [normalizeColumnExpr(ast, s, e as ExprColumnAst)];
    }
    case ExprType.Func: {
      // we need to walk thru for the exprs in the arguments!
      // we need to copy this function ast and then modify it...
      const newColumn = JSON.parse(JSON.stringify(e));
      normalizeFuncExpr(ast, s, newColumn);
      return [newColumn];
    }
    case ExprType.Val:
      // no change, we can copy by reference
      return [e];

    case ExprType.Parenthesis: {
      // keep going
      return normalizeExpr(ast, s, (e as ExprParen).content);
    }
    case ExprType.Relation:
    default:
      // might be slow? #FIXME
      // return [JSON.parse(JSON.stringify(c))];
      LogInternalError(`Not all cases are handled: ${e.exprType}`);
  }
  return LogInternalError(`Should have returned by now`);
}

/**
 * This is ALL recursive...
 * must be incoked on ColumnSelection with ExprFunAsts
 * @param ast
 * @param s
 * @param c: will be modifying in place
 */
function normalizeFuncExpr(ast: DielAst, s: SelectionUnit, e: ExprFunAst) {
  let newArgs: ExprAst[] = [];
  for (let i = 0; i < e.args.length; i ++) {
    const a = e.args[i];
    newArgs = newArgs.concat(normalizeExpr(ast, s, a));
  }
  e.args = newArgs;
  return e;
}

/**
 * resursive
 * does NOT set in place
 * @param ast
 * @param s
 * @param c: will be modifying in place
 */
function normalizeColumnExpr(ast: DielAst, s: SelectionUnit, currentColumnExpr: ExprColumnAst): ExprColumnAst {
  // if there is already a source specified, do NOT modify
  if (currentColumnExpr.relationName) {
    return JSON.parse(JSON.stringify(currentColumnExpr));
  }
  const capsName = currentColumnExpr.columnName.toUpperCase();
  // TODO: we should probably just normalize the table instead of catching corner cases here
  if (capsName in BuiltInColumn) {
    const dataType = BuiltInColumnDataTypes.get(capsName);
    function createBuiltInColumnsIfReferencesEvent(ref: RelationReference) {
      if (ref.relationReferenceType === RelationReferenceType.Direct) {
        const relationName = (ref as RelationReferenceDirect).relationName;
        if (IsRelationEvent(ast, relationName)) {
          const newColumnExpr: ExprColumnAst = {
            exprType: ExprType.Column,
            dataType,
            columnName: currentColumnExpr.columnName,
            relationName,
          };
          return newColumnExpr;
        }
      }
      return null;
    }
    const newColumn = createBuiltInColumnsIfReferencesEvent(s.baseRelation);
    if (newColumn) return newColumn;
    if (s.joinClauses) {
      for (let i = 0 ; i < s.joinClauses.length; i ++) {
        const j = s.joinClauses[i];
        const newColumn = createBuiltInColumnsIfReferencesEvent(j.relation);
        if (newColumn) return newColumn;
      }
    }
    // the name might actually used by a different relation that is not built in; continue
  }
  // otherwise we need to search thru the relations for custom column names
  // const existingType = GetRelationColumnType(deAliasedRelationname, cn);
  if (s.baseRelation) {
    const found = checkIfColumnInRelationReference(ast, s.baseRelation, currentColumnExpr.columnName);
    if (found) return {
      exprType: ExprType.Column,
      dataType: found.dataType,
      columnName: currentColumnExpr.columnName,
      relationName: s.baseRelation.alias,
    };
    if (s.joinClauses) {
      for (let i = 0 ; i < s.joinClauses.length; i ++) {
        const jClause = s.joinClauses[i];
        const found = checkIfColumnInRelationReference(ast, jClause.relation, currentColumnExpr.columnName);
        if (found) return {
          exprType: ExprType.Column,
          dataType: found.dataType,
          columnName: currentColumnExpr.columnName,
          relationName: jClause.relation.alias,
        };
      }
    }
  }
  return LogInternalError(``);
}

function checkIfColumnInRelationReference(ast: DielAst, ref: RelationReference, columnName: string): SimpleColumn | null {
  // first see if the relation reference is direct
  const columns = columnsFromRelationReference(ast, ref);
  if (columns) return columns.find(c => c.cName === columnName);
  return null;
}
