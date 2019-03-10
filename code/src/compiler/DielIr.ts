import { DielAst, DerivedRelation, DataType, OriginalRelation, RelationType, SelectionUnit, CompositeSelection, Relation } from "../parser/dielAstTypes";
import { DependencyInfo } from "./passes/passesHelper";
import { LogWarning, LogInternalError } from "../lib/messages";
import { ExprType, ExprColumnAst } from "../parser/exprAstTypes";

type CompositeSelectionFunction<T> = (s: CompositeSelection, relationName?: string) => T;
export type SelectionUnitVisitorFunctionOptions = {relationName?: string, ir?: DielIr};
export type SimpleColumn = {columnName: string, type: DataType};
type SelectionUnitFunction<T> = (s: SelectionUnit, optional: SelectionUnitVisitorFunctionOptions) => T;

export enum BuiltInColumn {
  TIMESTEP = "TIMESTEP",
  TIMESTAMP = "TIMESTAMP"
}

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
  allDerivedRelations: Map<string, DerivedRelation>;
  allCompositeSelections: Map<string, CompositeSelection>;
  allOriginalRelations: Map<string, OriginalRelation>;
  // viewTypes: Map<string, Map<string, DataType>>;
  constructor(ast: DielAst) {
    this.ast = ast;
    // this.buildIndicesToIr();
    const allCompositeSelections = new Map();
    this.applyToAllCompositeSelection<void>((r, name) => {
      allCompositeSelections.set(name, r);
    });
    this.allCompositeSelections = allCompositeSelections;
    this.allOriginalRelations = new Map();
    this.GetOriginalRelations().map((r) => {
      this.allOriginalRelations.set(r.name, r);
    });
    this.allDerivedRelations = new Map();
    this.GetAllViews().map((r) => {
      this.allDerivedRelations.set(r.name, r);
    });
  }
  GetRelationDef(rName: string): Relation {
    // first search in original, then serach in derived, compalin otherwise
    const original = this.allOriginalRelations.get(rName);
    if (original) {
      return original;
    } else {
      const derived = this.allDerivedRelations.get(rName);
      if (derived) {
        return derived;
      } else {
        LogInternalError(`Relation ${rName} not defined`);
      }
    }
  }
  /**
   * Public helper functions
   */
  public GetRelationColumnType(relationName: string, columnName: string) {
    // return the type
    // first search the derived, then the source relations
    const derived = this.allCompositeSelections.get(relationName);
    if (derived) {
      return this.GetTypeFromDerivedRelationColumn(derived[0].relation, columnName);
    } else {
      const original = this.allOriginalRelations.get(relationName);
      if (!original) {
        return null;
      } else {
        const column = original.columns.filter(r => r.name === columnName);
        if (column.length > 0) {
          return column[0].type;
        } else {
          return null;
        }
      }
    }
  }

  public GetTypeFromDerivedRelationColumn(unit: SelectionUnit, columnName: string): DataType {
    const selections = unit.derivedColumnSelections;
    if (selections) {
      const column = selections.filter(s => {
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
    } else {
      LogInternalError(`Relation ${unit} does not have derivedColumnSelections`);
    }
  }

  public GetViews() {
    return this.ast.views;
  }

  public GetOutputs() {
    return this.ast.views
      .filter(r => r.relationType === RelationType.Output);
  }

  public GetAllViews() {
    return this.ast.views
      .filter(r => r.relationType !== RelationType.StaticTable);
  }

  public GetEventByName(n: string) {
    // could be either a table or a view
    const o = this.allOriginalRelations.get(n);
    if (o) {
      return o;
    }
    const d = this.allDerivedRelations.get(n);
    if (d && (d.relationType === RelationType.EventView)) {
      return d;
    }
    LogWarning(`GetEventByName for ${n} failed`);
  }

  /**
   * returns all the event relations by name
   */
  public GetEventRelationNames() {
    const originals = this.ast.originalRelations
      .filter(r => r.relationType === RelationType.EventTable)
      .map(i => i.name);
    const derived = this.ast.views
      .filter(r => r.relationType === RelationType.EventView)
      .map(d => d.name);
    return originals.concat(derived);
  }

  public GetOriginalRelations() {
    return this.ast.originalRelations;
  }

  public GetDielDefinedOriginalRelation() {
    return this.ast.originalRelations
      .filter(r => r.relationType !== RelationType.ExistingAndImmutable);
  }
  // <T>(fun: DerivedRelationFunction<T>): T[] {
  //     .map(r => fun(r, r.name));
  // }

  // public IterateOverOutputs<T>(fun: DerivedRelationFunction<T>): T[] {
  //   return this.ast.views
  //     .filter(r => r.relationType === DerivedRelationType.View)
  //     .map(r => fun(r, r.name));
  // }

  // public IterateOverInputs<T>(fun: ExistingRelationFunction<T>): T[] {
  //   return this.ast.originalRelations
  //     .filter(r => r.relationType === OriginalRelationType.Input)
  //     .map(r => fun(r, r.name));
  // }

  // public IterateOverDielDefinedOriginalRelation<T>(fun: ExistingRelationFunction<T>): T[] {
  //   // so there are the inputs, the static tables
  //   return this.ast.originalRelations
  //     .filter(r => r.relationType !== OriginalRelationType.ExistingAndImmutable)
  //     .map(r => fun(r, r.name));
  // }

  /**
   * Warning: this method does not actually visit all the selection units
   *   e.g., if it's a where predicate with a subquery, it's not going to visit the unit
   *         selection from that subquery.
   * @param fun
   * @param byDependency
   */
  public ApplyToImmediateSelectionUnits<T>(fun: SelectionUnitFunction<T>, byDependency = false): T[] {
    const ir = this;
    function applyToDerivedRelation<T>(r: DerivedRelation, fun: SelectionUnitFunction<T>): T[] {
      return r.selection.compositeSelections.map(c => fun(c.relation, {ir, relationName: r.name}));
    }
    let initial: T[] = [];
    if (byDependency) {
      // check if the dependency graph has been built, if not, build it now
      ir.dependencies.topologicalOrder.reduce(
        (acc: T[], r) => {
          const compositeSelection = ir.allCompositeSelections.get(r);
          if (compositeSelection) {
            return acc.concat(compositeSelection.map(c => fun(c.relation, {ir, relationName: r})));
          } else {
            // this is an input, it's normal
            // LogInternalError(`Composition Selection ${r} was not found`);
            return [];
          }
        }, initial);
    } else {
      // this step flattens
      ir.ast.views.reduce((acc, r) => acc.concat(applyToDerivedRelation(r, fun)), initial);
    }
    return initial;
  }

  // TODO: some broken logic here...
  // public VisitSelections(visitSelection: (r: RelationSelection) => void) {
  //   const ast = this.ast;
  //   ast.views.map(v => visitSelection(v.selection));
  //   this.IterateOverOutputs<void>(v => visitSelection(v.selection));
  //   ast.programs.map(p => {
  //     p.queries.map(q => {
  //       if (q.astType === AstType.RelationSelection) {
  //         visitSelection(q as RelationSelection);
  //       } else {
  //         sanityAssert((q.astType === AstType.Insert), "did not expect anything other than insert or selects");
  //         const i = q as InsertionClause;
  //         if (i.selection) {
  //           visitSelection(i.selection);
  //         }
  //       }
  //     });
  //   });
  // }

  applyToAllCompositeSelection<T>(fun: CompositeSelectionFunction<T>, byDependency = false): T[] {
    if (byDependency) {
      let initial: T[] = [];
      // check if the dependency graph has been built, if not, build it now
      this.dependencies.topologicalOrder.reduce(
        (acc, r) => {
          const compositeSelection = this.allCompositeSelections.get(r);
          if (compositeSelection) {
            return acc.concat(fun(compositeSelection, r));
          } else {
            LogInternalError(`Composition Selection ${r} was not found`);
            return [];
          }
        }, initial);
      return initial;
    } else {
      // this step flattens
      return this.ast.views.map(r => fun(r.selection.compositeSelections, r.name));
    }
  }

}