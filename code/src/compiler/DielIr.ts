import { DielAst, DerivedRelation, DataType, BuiltInColumns, OriginalRelation } from "../parser/dielAstTypes";
import { SelectionUnit, CompositeSelection, Column, ColumnSelection, RelationReference, getRelationReferenceName } from "../parser/sqlAstTypes";
import { DependencyInfo } from "./passes/passesHelper";
import { LogInternalError, ReportDielUserError } from "../lib/messages";
import { ExprType, ExprFunAst, ExprColumnAst, ExprAst } from "../parser/exprAstTypes";
import { copyColumnSelection, createColumnSectionFromRelationReference } from "./passes/helper";

type CompositeSelectionFunction<T> = (s: CompositeSelection, relationName?: string) => T;
type ExistingRelationFunction<T> = (s: OriginalRelation, relationName?: string) => T;
export type SimpleColumn = {columnName: string, type: DataType};

/**
 * instead of exposing the IR internals whenever something accesses it
 * we will abstract it away in a class (doesn't have to be OO,
 *   just easier to reason about for now)
 */
export class DielIr {

  ast: DielAst;
  dependencies: DependencyInfo;
  // we want to access the derived relations by name and be iterables
  // FIXME: a bit weird that we are accessing the selection directly for derived but not for the dynamic one...
  allDerivedRelations: Map<string, CompositeSelection>;
  allOriginalRelations: Map<string, OriginalRelation>;
  // viewTypes: Map<string, Map<string, DataType>>;
  constructor(ast: DielAst) {
    this.ast = ast;
    this.buildIndicesToIr();
  }

  buildIndicesToIr() {
    const allDerivedRelations = new Map();
    this.applyToAllCompositeSelection<void>((r, name) => {
      allDerivedRelations.set(name, r);
    });
    this.allDerivedRelations = allDerivedRelations;
    const allOriginalRelations = new Map();
    this.applyToAllExistingRelation<void>((r, name) => {
      allOriginalRelations.set(name, r);
    });
    this.allOriginalRelations = allOriginalRelations;
  }

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





  getUdfType(funName: string) {
    const r = this.ast.udfTypes.filter(u => u.udf === funName);
    if (r.length !== 1) {
      LogInternalError(`Type of ${funName} not defined.`);
    }
    return r[0].type;
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