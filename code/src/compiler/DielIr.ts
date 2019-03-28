import { DielAst, DerivedRelation, DataType, OriginalRelation, RelationType, SelectionUnit, CompositeSelection, Relation, Command } from "../parser/dielAstTypes";
import { DependencyInfo } from "./passes/passesHelper";
import { LogInternalWarning, LogInternalError, DielInternalErrorType } from "../lib/messages";
import { ExprType, ExprColumnAst, ExprFunAst } from "../parser/exprAstTypes";
import { RelationIdType } from "./DielPhysicalExecution";

type CompositeSelectionFunction<T> = (s: CompositeSelection, relationName?: string) => T;
export type SelectionUnitVisitorFunctionOptions = {relationName?: string, ir?: DielIr};
export type SimpleColumn = {columnName: string, type: DataType};
type SelectionUnitFunction<T> = (s: SelectionUnit, optional: SelectionUnitVisitorFunctionOptions) => T;

export enum BuiltInColumn {
  TIMESTEP = "TIMESTEP",
  TIMESTAMP = "TIMESTAMP"
}

const DerivedRelationTypes = new Set([RelationType.View, RelationType.EventView, , RelationType.Output, RelationType.DerivedTable]);
const OriginalRelationTypes = new Set([RelationType.Table, RelationType.EventTable, RelationType.ExistingAndImmutable]);

export function isRelationTypeDerived(rType: RelationType) {
  if (DerivedRelationTypes.has(rType)) {
    return true;
  } else if (OriginalRelationTypes.has(rType)) {
    return false;
  } else {
    LogInternalError(`RelationType ${rType} is not defined to be derived or not`);
  }
}

export function columnsFromSelectionUnit(su: SelectionUnit): SimpleColumn[] {
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

// --------------- Gettter functions for AST BEGIN --------------------
export function GetAllDerivedViews(ast: DielAst): DerivedRelation[] {
  return ast.relations.filter(r => isRelationTypeDerived(r.relationType)) as DerivedRelation[];
}

export function GetAllPrograms(ast: DielAst) {
  let allCommands: Command[]  = [];
  ast.programs.forEach((commands, _) => {
    allCommands = allCommands.concat(commands);
  });
  return allCommands;
}

// --------------- Gettter functions for AST END --------------------

export class DielIr {

  ast: DielAst;
  dependencies: DependencyInfo;
  private allDerivedRelations: Map<string, DerivedRelation>;
  private allCompositeSelections: Map<string, CompositeSelection>;
  private allOriginalRelations: Map<string, OriginalRelation>;
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
    this.GetAllDerivedViews().map((r) => {
      this.allDerivedRelations.set(r.name, r);
    });
  }

  GetRelationDef(rName: string): Relation {
    // first search in original, then serach in derived, compalin otherwise
    const result = this.ast.relations.find(r => r.name === rName);
    if (result) {
      return result;
    } else {
      LogInternalError(`Relation ${rName} not defined`);
    }
    // const original = this.allOriginalRelations.get(rName);
    // if (original) {
    //   return original;
    // } else {
    //   const derived = this.allDerivedRelations.get(rName);
    //   if (derived) {
    //     return derived;
    //   } else {
    //   }
    // }
  }

  public GetRelationColumnType(relationName: string, columnName: string): DataType | null {
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

  public GetTypeFromDerivedRelationColumn(unit: SelectionUnit, columnName: string): DataType | null {
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
  public GetColumnsFromRelationName(relationName: string): SimpleColumn[] {
    const relationDef = this.GetRelationDefinition(relationName);
    if (relationDef) {
      if (isRelationTypeDerived(relationDef.relationType)) {
        return columnsFromSelectionUnit((relationDef as DerivedRelation).selection.compositeSelections[0].relation);
      } else {
        return (relationDef as OriginalRelation).columns.map(c => ({columnName: c.name, type: c.type}));
      }
    } else {
      // note for LUCIE: this is a good place to add the fuzzy search for correct relation name suggestion
      LogInternalError(`Cannot find relation ${relationName}`, DielInternalErrorType.RelationNotFound);
    }
  }

  public GetRelationDefinition(relationName: RelationIdType) {
    return this.ast.relations.find(r => r.name === relationName);
  }

  public GetAllDerivedViews(): DerivedRelation[] {
    return this.ast.relations.filter(r => isRelationTypeDerived(r.relationType)) as DerivedRelation[];
  }

  public GetOutputs(): DerivedRelation[] {
    return this.ast.relations.filter(r => r.relationType === RelationType.Output) as DerivedRelation[];
  }

  public GetOriginalRelations(): OriginalRelation[] {
    return this.ast.relations.filter(r => !isRelationTypeDerived(r.relationType)) as OriginalRelation[];
  }

  public GetDielDefinedOriginalRelation() {
    return this.GetOriginalRelations().filter(r => r.relationType !== RelationType.ExistingAndImmutable);
  }

  public GetEventByName(n: string) {
    const o = this.allOriginalRelations.get(n);
    if (o) {
      return o;
    }
    const d = this.allDerivedRelations.get(n);
    if (d && (d.relationType === RelationType.EventView)) {
      return d;
    }
    LogInternalWarning(`GetEventByName for ${n} failed`);
  }

  /**
   * returns all the event relations by name
   */
  public GetEventRelationNames() {
    return this.ast.relations
      .filter(r => ((r.relationType === RelationType.EventTable) || (r.relationType === RelationType.EventView)))
      .map(i => i.name);
  }

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
    if (byDependency && ir.dependencies) {
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
      ir.GetAllDerivedViews().reduce((acc, r) => acc.concat(applyToDerivedRelation(r, fun)), initial);
    }
    return initial;
  }

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
      return this.GetAllDerivedViews().map(r => fun(r.selection.compositeSelections, r.name));
    }
  }

}