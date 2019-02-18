import { DielAst, DerivedRelation, DataType, BuiltInColumns, OriginalRelation, OriginalRelationType, DerivedRelationType } from "../parser/dielAstTypes";
import { SelectionUnit, CompositeSelection, Column, ColumnSelection, RelationReference, getRelationReferenceName, RelationSelection, AstType, InsertionClause } from "../parser/sqlAstTypes";
import { DependencyInfo } from "./passes/passesHelper";
import { LogInternalError, ReportDielUserError, sanityAssert } from "../lib/messages";
import { ExprType, ExprFunAst, ExprColumnAst, ExprAst } from "../parser/exprAstTypes";
import { copyColumnSelection, createColumnSectionFromRelationReference } from "./passes/helper";

type CompositeSelectionFunction<T> = (s: CompositeSelection, relationName?: string) => T;
type DerivedRelationFunction<T> = (s: DerivedRelation, relationName?: string) => T;
type ExistingRelationFunction<T> = (s: OriginalRelation, relationName?: string) => T;
export type SelectionUnitVisitorFunctionOptions = {relationName?: string, ir?: DielIr};
export type SimpleColumn = {columnName: string, type: DataType};
type SelectionUnitFunction<T> = (s: SelectionUnit, optional: SelectionUnitVisitorFunctionOptions) => T;
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

  /**
   * Public helper functions
   */
  public GetRelationColumnType(relationName: string, columnName: string) {
    // return the type
    // first search the derived, then the source relations
    const derived = this.allDerivedRelations.get(relationName);
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

  public GetViews() {
    return this.ast.views;
  }

  public GetOutputs() {
    return this.ast.views
      .filter(r => r.relationType === DerivedRelationType.View);
  }

  public GetInputs() {
    return this.ast.originalRelations
      .filter(r => r.relationType === OriginalRelationType.Input);
  }

  public GetOriginalRelations() {
    return this.ast.originalRelations;
  }

  public GetDielDefinedOriginalRelation() {
    return this.ast.originalRelations
      .filter(r => r.relationType !== OriginalRelationType.ExistingAndImmutable);
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

  public ApplyToAllSelectionUnits<T>(fun: SelectionUnitFunction<T>, byDependency = false): T[] {
    const ir = this;
    function applyToDerivedRelation<T>(r: DerivedRelation, fun: SelectionUnitFunction<T>): T[] {
      return r.selection.compositeSelections.map(c => fun(c.relation, {ir, relationName: r.name}));
    }
    let initial: T[] = [];
    if (byDependency) {
      // check if the dependency graph has been built, if not, build it now
      ir.dependencies.topologicalOrder.reduce(
        (acc, r) => acc.concat(ir.allDerivedRelations.get(r).map(c => fun(c.relation, {ir, relationName: r}))), initial);
    } else {
      // this step flattens
      ir.ast.views.reduce((acc, r) => acc.concat(applyToDerivedRelation(r, fun)), initial);
      return initial;
    }
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

  public GetUdfType(funName: string) {
    const r = this.ast.udfTypes.filter(u => u.udf === funName);
    if (r.length !== 1) {
      LogInternalError(`Type of ${funName} not defined.`);
    }
    return r[0].type;
  }

  buildIndicesToIr() {
    const allDerivedRelations = new Map();
    this.applyToAllCompositeSelection<void>((r, name) => {
      allDerivedRelations.set(name, r);
    });
    this.allDerivedRelations = allDerivedRelations;
    const allOriginalRelations = new Map();
    this.GetOriginalRelations().map((r) => {
      allOriginalRelations.set(r.name, r);
    });
    this.allOriginalRelations = allOriginalRelations;
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
      return this.ast.views.map(r => fun(r.selection.compositeSelections, r.name));
    }
  }

}