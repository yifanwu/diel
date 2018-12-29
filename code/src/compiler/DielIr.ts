import { DielAst, DerivedRelation, DataType, BuiltInColumns } from "../parser/dielAstTypes";
import { SelectionUnit, CompositeSelection } from "../parser/sqlAstTypes";
import { normalizeColumnSelection } from "./passes/removeStarSelects";
import { applyCrossfilter } from "./passes/applyCrossfilter";
import { getSelectionUnitDep, DependencyInfo, getTopologicalOrder } from "./passes/passesHelper";
import { applyTemplates } from "./passes/applyTemplate";
import { LogInternalError, ReportDielUserError } from "../lib/messages";
import { ExprType, ExprFunAst, ExprColumnAst, ExprAst } from "../parser/exprAstTypes";

type SelectionUnitFunction<T> = (s: SelectionUnit, relationName?: string) => T;
type CompositeSelectionFunction<T> = (s: CompositeSelection, relationName?: string) => T;

// helpers
function applyToDerivedRelation<T>(r: DerivedRelation, fun: SelectionUnitFunction<T>): T[] {
  return r.selection.compositeSelections.map(c => fun(c.relation));
}

/**
 * instead of exposing the IR internals whenever something accesses it
 * we will abstract it away in a class (doesn't have to be OO,
 *   just easier to reason about for now)
 */
export class DielIr {
  ast: DielAst;
  dependencies: DependencyInfo;
  // we want to access the derived relations by name and be iterable
  allDerivedRelations: Map<string, CompositeSelection>;
  // viewTypes: Map<string, Map<string, DataType>>;

  constructor(ast: DielAst) {
    this.ast = ast;
    this.buildIndicesToIr();
    // build the tree
    // the follow mismash of this vs passing variable around should be fixed.
    this.getDependnecies();
    applyTemplates(this.ast);
    applyCrossfilter(this.ast);
    normalizeColumnSelection(this.ast);
    this.inferType();
  }

  buildIndicesToIr() {
    this.allDerivedRelations = new Map();
    const lookup = this.allDerivedRelations;
    this.applyToAllCompositeSelection<void>((r, name) => {
      lookup[name] = r;
    });
  }

  getDependnecies() {
    // first build the tree
    let depTree = new Map();
    this.applyToAllSelectionUnits(((s, rName) => {
      const deps = getSelectionUnitDep(s);
      let dependsOn;
      if (depTree.has(rName)) {
        const existingDep = depTree.get(rName);
        dependsOn = deps.concat(existingDep);
      } else {
        dependsOn = deps;
      }
      depTree.set(rName, {
        dependsOn,
        isDependentOn: null
      });
    }));
    // TODO need to do another pass to set the isDependentOn
    const topologicalOrder = getTopologicalOrder(depTree);
    this.dependencies = {
      depTree,
      topologicalOrder
    };
  }

  inferType() {
    this.applyToAllSelectionUnits(this.inferTypeForSelection, true);
  }

  inferTypeForSelection(r) {
    r.columnSelections.map(cs => {
      if (!cs.expr) {
        LogInternalError(`the selection must have been parsed`);
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
      // case 1: check for keywords
      const special = BuiltInColumns.filter(sc => sc.column === columnExpr.column.columnName)[0];
      if (special) {
        return special.type;
      }

      const existingRelation = this.allDerivedRelations.get(columnExpr.column.relationName);
      let columnFound;
      if (existingRelation) {
        // case 2: defined relations
        columnFound =  existingRelation[0].relation.columns.filter(c => c.name === columnExpr.column.columnName);
      } else {
        // case 3: must be a temp table defined in a join
        // we need to access the scope of the current selection
        r.joinClauses.map(j => {
          // temp table can only be defined as alias...
          if (j.relation.alias === columnExpr.column.relationName) {
            // found it
            const tempRelation = j.relation.subquery.compositeSelections[0].relation;
            this.inferTypeForSelection(tempRelation);
            // now access it, should be fine...
            columnFound = tempRelation.columns.filter(c => c.name === columnExpr.column.columnName);
          }
        });
      }
      if (!columnFound || columnFound.length !== 1) {
        throw ReportDielUserError(`Your referenced column ${columnExpr.column.columnName} does not exist in relation ${columnExpr.column.relationName}`);
      }
      return columnFound[0].type;
    }
  }

  getUdfType(funName: string) {
    const r = this.ast.udfTypes.filter(u => u.udf === funName);
    if (r.length !== 1) {
      LogInternalError(`Type of ${funName} not defined.`);
    }
    return r[0].type;
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
        (acc, r) => acc.concat(this.allDerivedRelations.get(r).map(c => fun(c.relation)))
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
      // check if the dependency graph has been built, if not, build it now
      throw Error(`TO implement`);
    } else {
      // this step flattens
      return this.ast.outputs.map(r => fun(r.selection.compositeSelections, r.name))
        .concat(this.ast.views.map(r => fun(r.selection.compositeSelections, r.name)));
    }
  }
}