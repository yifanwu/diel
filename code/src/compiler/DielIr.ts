import { DielAst, DerivedRelation, DataType, BuiltInColumns, DielConfig, OriginalRelation } from "../parser/dielAstTypes";
import { SelectionUnit, CompositeSelection, Column, ColumnSelection, RelationReference, getRelationReferenceName } from "../parser/sqlAstTypes";
import { DependencyInfo } from "./passes/passesHelper";
import { LogInternalError, ReportDielUserError } from "../lib/messages";
import { ExprType, ExprFunAst, ExprColumnAst, ExprAst } from "../parser/exprAstTypes";
import { copyColumnSelection, createColumnSectionFromRelationReference } from "./passes/helper";

type SelectionUnitFunction<T> = (s: SelectionUnit, relationName?: string) => T;
type CompositeSelectionFunction<T> = (s: CompositeSelection, relationName?: string) => T;
type ExistingRelationFunction<T> = (s: OriginalRelation, relationName?: string) => T;
export type SimpleColumn = {columnName: string, type: DataType};

// helpers
function applyToDerivedRelation<T>(r: DerivedRelation, fun: SelectionUnitFunction<T>): T[] {
  return r.selection.compositeSelections.map(c => fun(c.relation, r.name));
}

/**
 * instead of exposing the IR internals whenever something accesses it
 * we will abstract it away in a class (doesn't have to be OO,
 *   just easier to reason about for now)
 */
export class DielIr {
  static GetSimpleColumnsFromSelectionUnit(ast: SelectionUnit): any {
    throw new Error("Method not implemented.");
  }
  ast: DielAst;
  config: DielConfig;
  dependencies: DependencyInfo;
  // we want to access the derived relations by name and be iterables
  // FIXME: a bit weird that we are accessing the selection directly for derived but not for the dynamic one...
  allDerivedRelations: Map<string, CompositeSelection>;
  allOriginalRelations: Map<string, OriginalRelation>;
  // viewTypes: Map<string, Map<string, DataType>>;


  /**
   * Public helper functions
   */
  GetRelationColumnType(relationName: string, columnName: string) {
    // return the type
    // first search the derived, then the source relations
    const derived = this.allDerivedRelations.get(relationName);
    if (derived) {
      return this.GetTypeFromDerivedRelationColumn(derived[0].relation, columnName);
    } else {
      const original = this.allOriginalRelations.get(relationName).columns;
      if (!original) {
        return null;
      } else {
        const column = original.filter(r => r.name === columnName);
        if (column.length > 0) {
          return column[0].type;
        } else {
          return null;
        }
      }
    }
  }

  GetTypeFromDerivedRelationColumn(unit: SelectionUnit, columnName: string): DataType {
    const column = unit.derivedColumnSelections.filter(s => {
      if (s.expr.exprType === ExprType.Column) {
        return (s.expr as ExprColumnAst).columnName === columnName;
      } else if (s.expr.exprType === ExprType.Func) {
        return (s.alias === columnName);
      }
    });
    if (column.length > 0) {
      return column[0].expr.dataType;
    } else {
      return null;
    }
  }

  GetSimpleColumnsFromSelectionUnit(su: SelectionUnit): SimpleColumn[] {
    return su.derivedColumnSelections.map(cs => {
      if (cs.expr.exprType === ExprType.Column) {
        const columnExpr = cs.expr as ExprColumnAst;
        return {
          columnName: cs.alias ? cs.alias : columnExpr.columnName,
          type: columnExpr.dataType
        };
      } else {
        const functionExpr = cs.expr as ExprFunAst;
        return {
          columnName: cs.alias,
          type: functionExpr.dataType
        };
      }
    });
  }

  normalizeColumnForSelectionUnit(s: SelectionUnit) {
    const derivedColumnSelections: ColumnSelection[][] = s.columnSelections.map(c => {
      if (c.expr.exprType === ExprType.Column) {
        const currentColumnExpr = c.expr as ExprColumnAst;
        if (currentColumnExpr.hasStar) {
          // both of the following options will need to append to the selections
          if (currentColumnExpr.relationName) {
            // case 1: find the columns of just the relations specified
            const populatedColumns = this.getSimpleColumnsFromLocalSelectionUnit(s, currentColumnExpr.relationName)
              .map(newColumn => ({
                expr: {
                  exprType: ExprType.Column,
                  dataType: newColumn.type,
                  hasStar: false,
                  columnName: newColumn.columnName,
                  relationName: currentColumnExpr.relationName
                },
                // cannot alias stars
                alias: null,
              }));
            return populatedColumns;
          } else {
            // case 2: find all the relations
            const populatedColumnsFromBase: ColumnSelection[] = this.getSimpleColumnsFromRelationReference(s.baseRelation)
              .map(newColumn => ({
                expr: {
                  exprType: ExprType.Column,
                  dataType: newColumn.type,
                  hasStar: false,
                  columnName: newColumn.columnName,
                  relationName: getRelationReferenceName(s.baseRelation)
                },
                // cannot alias stars
                alias: null
              }));
            let populatedColumnsFromJoins: ColumnSelection[] = [];
            s.joinClauses.map(j => {
              const relationName = getRelationReferenceName(j.relation);
              const newColumns: ColumnSelection[] = this.getSimpleColumnsFromRelationReference(j.relation).map(c => ({
                expr: {
                  exprType: ExprType.Column,
                  dataType: DataType.TBD,
                  hasStar: false,
                  columnName: c.columnName,
                  relationName: relationName,
                },
                alias: null
              }));
              populatedColumnsFromJoins.push(...newColumns);
            });
            return populatedColumnsFromBase.concat(populatedColumnsFromJoins);
          }
        } else if (currentColumnExpr.relationName) {
          // not need to change; copy the column
          return [copyColumnSelection(c)];
        } else {
          // TODO: the relation needs to be found and copied in!
          // FIND the relation!
          // NOTE: not going to handle unnamed temporary relation for now, e.g.
          // `select a from (select a from t1);`
          // case 1: relation is in baserelation
          const columnsFrombaseSelection = this.getSimpleColumnsFromRelationReference(s.baseRelation);
          const foundFrombase = columnsFrombaseSelection.filter(cBase => cBase.columnName === currentColumnExpr.columnName);
          if (foundFrombase.length > 0) {
            // FIXME: this assumption will break when the relation is temporarily defined
            return [createColumnSectionFromRelationReference(c, foundFrombase[0], s.baseRelation.relationName)];
          }
        }
      } else {
        // this as to be a function
        if (c.expr.exprType !== ExprType.Func) {
          ReportDielUserError(`selections must be columns or functions`);
        }
        // now add it to derived; copy by rendrence for now... #FIXME
        return [c];
      }
    });
    s.derivedColumnSelections = [].concat(...derivedColumnSelections);
  }


  inferTypeForSelection(r: SelectionUnit) {
    r.derivedColumnSelections.map(cs => {
      if (!cs.expr) {
        LogInternalError(`the selection must have been parsed`);
      }
      if (!cs.expr.dataType) {
        LogInternalError(`derivedColumnSelections should be defined`);
      }
      if (cs.expr.dataType === DataType.TBD) {
        cs.expr.dataType = this.getTypeForColumnSelection(cs.expr, r);
      }
    });
  }

  getTypeForColumnSelection(expr: ExprAst, r: SelectionUnit): DataType {
    if (expr.exprType === ExprType.Func) {
      // the functions should either be loaded into the compiler, or have their types specified via DIEL inputs
      // actually pretty hard to implement that reflection?
      // if selection, check what it's selected from
      const funExpr = expr as ExprFunAst;
      return this.getUdfType(funExpr.functionReference);
    } else if (expr.exprType === ExprType.Column) {
      const columnExpr = expr as ExprColumnAst;
      // make sure that the source is specified
      if (!columnExpr.relationName) {
        LogInternalError(`The normalization pass screwed up and did not specify the source relation for ${JSON.stringify(columnExpr)}`);
      }
      const cn = columnExpr.columnName;
      // case 1: check for keywords
      const special = BuiltInColumns.filter(sc => sc.column === cn)[0];
      if (special) {
        return special.type;
      }
      // map columnName to simple alias
      // first check base
      let deAliasedRelationname = columnExpr.relationName;
      if (r.baseRelation.alias && r.baseRelation.relationName && (columnExpr.relationName === r.baseRelation.alias)) {
        deAliasedRelationname = r.baseRelation.relationName;
      }
      // TODO: check for joins as well
      // directly see if it's found
      const existingType = this.GetRelationColumnType(deAliasedRelationname, cn);
      // checking for subqueries
      if (!existingType) {
        // case 3: must be a temp table defined in a join or aliased
        // we need to access the scope of the current selection
        // TODO/FIXME: check base!
        // check joins
        r.joinClauses.map(j => {
          // temp table can only be defined as alias...
          if (j.relation.alias === columnExpr.relationName) {
            // found it
            const tempRelation = j.relation.subquery.compositeSelections[0].relation;
            this.inferTypeForSelection.bind(this)(tempRelation);
            // now access it, should be fine...
            return this.GetTypeFromDerivedRelationColumn(tempRelation, cn);
          }
        });
        throw new Error("Should have found a type by now!");
      } else {
        return existingType;
      }
    }
  }

  getUdfType(funName: string) {
    const r = this.ast.udfTypes.filter(u => u.udf === funName);
    if (r.length !== 1) {
      LogInternalError(`Type of ${funName} not defined.`);
    }
    return r[0].type;
  }

  getSimpleColumnsFromLocalSelectionUnit(s: SelectionUnit, refName: string): SimpleColumn[] {
    const baseResult = this.getSimpleColumnsFromRelationReference(s.baseRelation, refName);
    if (!baseResult) {
      // in joinClause
      for (let i = 0; i < s.joinClauses.length; i ++) {
        const joinRef = s.joinClauses[i];
        const joinResult = this.getSimpleColumnsFromRelationReference(joinRef.relation, refName);
        if (joinResult) {
          return joinResult;
        }
      }
    } else {
      return baseResult;
    }
    ReportDielUserError(`Relation not defined`);
  }

  getSimpleColumnsFromRelationReference(ref: RelationReference, refName?: string): SimpleColumn[] {
    if (refName && !((ref.alias === refName) || (ref.relationName === refName))) {
      return null;
    }
    if (ref.subquery) {
      return this.GetSimpleColumnsFromSelectionUnit(ref.subquery.compositeSelections[0].relation);
    } else {
      return this.getSimpleColumnsFromRelationName(ref.relationName);
    }
  }


  getSimpleColumnsFromRelationName(relationName: string): SimpleColumn[] {
    const derived = this.allDerivedRelations.get(relationName);
    if (derived) {
      return this.GetSimpleColumnsFromSelectionUnit(derived[0].relation);
    }
    const original = this.allOriginalRelations.get(relationName).columns;
    if (original) {
      return original.map(c => ({columnName: c.name, type: c.type}));
    }
    LogInternalError(`Cannot find relation ${relationName}`);
  }

  /**
   * We do not need to apply to programs for now since they don't really need to be understood
   * I think selection unit is fine for now?
   * @param ast abstract syntax tree of the DIEL program
   * @param fun function to apply to the relations
   */
  applyToAllSelectionUnits<T>(fun: SelectionUnitFunction<T>, byDependency = false): T[] {
    // let result: any[] = [];
    let initial: T[] = [];
    if (byDependency) {
      // check if the dependency graph has been built, if not, build it now
      // throw Error(`To implement`);
      this.dependencies.topologicalOrder.reduce(
        (acc, r) => acc.concat(this.allDerivedRelations.get(r).map(c => fun(c.relation, r)))
        , initial);
    } else {
      // this step flattens
      this.ast.outputs.reduce((acc, r) => acc.concat(applyToDerivedRelation(r, fun)), initial);
      this.ast.views.reduce((acc, r) => acc.concat(applyToDerivedRelation(r, fun)), initial);
      return initial;
    }
  }

  applyToAllCompositeSelection<T>(fun: CompositeSelectionFunction<T>, byDependency = false): T[] {
    if (byDependency) {
      let initial: T[] = [];
      // check if the dependency graph has been built, if not, build it now
      this.dependencies.topologicalOrder.reduce(
        (acc, r) => acc.concat(fun(this.allDerivedRelations.get(r), r))
        , initial);
    } else {
      // this step flattens
      return this.ast.outputs.map(r => fun(r.selection.compositeSelections, r.name))
        .concat(this.ast.views.map(r => fun(r.selection.compositeSelections, r.name)));
    }
  }

  applyToAllExistingRelation<T>(fun: ExistingRelationFunction<T>): T[] {
    // so there are the inputs, the static tables
    return this.ast.inputs.map(r => fun(r, r.name))
      .concat(this.ast.originalRelations.map(r => fun(r, r.name)));
  }
}