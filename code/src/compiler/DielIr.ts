import { DielAst, DerivedRelation, DataType, BuiltInColumns, DielConfig } from "../parser/dielAstTypes";
import { SelectionUnit, CompositeSelection, Column } from "../parser/sqlAstTypes";
import { normalizeColumnSelection } from "./passes/removeStarSelects";
import { applyCrossfilter } from "./passes/applyCrossfilter";
import { getSelectionUnitDep, DependencyInfo, getTopologicalOrder } from "./passes/passesHelper";
import { applyTemplates } from "./passes/applyTemplate";
import { LogInternalError, ReportDielUserError, LogInfo } from "../lib/messages";
import { ExprType, ExprFunAst, ExprColumnAst, ExprAst } from "../parser/exprAstTypes";
import { createSqlIr } from "./codegen/createSqlIr";
import { genTs } from "./codegen/codeGenTs";
import { generateSqlFromIr } from "./codegen/codeGenSql";

type SelectionUnitFunction<T> = (s: SelectionUnit, relationName?: string) => T;
type CompositeSelectionFunction<T> = (s: CompositeSelection, relationName?: string) => T;
type ExistingRelationFunction<T> = (s: Column[], relationName?: string) => T;

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
  ast: DielAst;
  config: DielConfig;
  dependencies: DependencyInfo;
  // we want to access the derived relations by name and be iterables
  allDerivedRelations: Map<string, CompositeSelection>;
  allOriginalRelations: Map<string, Column[]>;
  // viewTypes: Map<string, Map<string, DataType>>;

  constructor(ast: DielAst, config: DielConfig) {
    this.ast = ast;
    this.config = config;
    this.buildIndicesToIr();
    // build the tree
    // the follow mismash of this vs passing variable around should be fixed.
    this.getDependnecies();
    applyTemplates(this.ast);
    applyCrossfilter(this.ast);
    normalizeColumnSelection(this.ast);
    this.inferType();
  }

  /**
   * returns an array of SQL queries
   * @param relationName If not specified, will generate for all
   */
  GenerateSql(relationName?: string) {
    if (!relationName) {
      const sqlIr = createSqlIr(this.ast);
      return generateSqlFromIr(sqlIr);
    } else {
      throw new Error(`Not implemented`);
      // look up the relation
    }
  }

  async GenerateTs() {
    return genTs(this.ast, this.dependencies.depTree);
  }

  /**
   * Public helper functions
   */
  GetRelationColumnType(relationName: string, columnName: string) {
    // return the type
    // first search the derived, then the source relations
    const derived = this.allDerivedRelations.get(relationName);
    if (derived) {
      const column = derived[0].relation.derivedColumnSelections.filter(s => {
        if (s.expr.exprType === ExprType.Column) {
          return (s.expr as ExprColumnAst).columnName === columnName;
        } else if (s.expr.exprType === ExprType.Func) {
          return (s.alias === columnName);
        }
      });
      if (column.length > 0) {
        column[0].expr.dataType;
      } else {
        return null;
      }
    } else {
      const original = this.allOriginalRelations.get(relationName);
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
  /**
   * below are all internal methods
   */
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

  getDependnecies() {
    // first build the tree
    let depTree = new Map();
    this.applyToAllSelectionUnits<void>((s, rName) => {
      if (!rName) {
        throw new Error(`relation name must be defined`);
      }
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
    });
    // TODO need to do another pass to set the isDependentOn
    const topologicalOrder = getTopologicalOrder(depTree);
    this.dependencies = {
      depTree,
      topologicalOrder
    };
  }

  inferType() {
    this.applyToAllSelectionUnits(this.inferTypeForSelection.bind(this), true);
  }

  inferTypeForSelection(r: SelectionUnit) {
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

      const foundRelation = this.allDerivedRelations.get(columnExpr.column.relationName);
      let foundColumns: Column[];
      let columnFound: Column[];
      if (foundRelation) {
        // case 2: defined relations
        foundColumns = foundRelation[0].relation.columns;
      } else {
        // let's try the existing relations
        foundColumns = this.allOriginalRelations.get(columnExpr.column.relationName);
        if (!foundColumns) {
          // case 3: must be a temp table defined in a join
          // we need to access the scope of the current selection
          r.joinClauses.map(j => {
            // temp table can only be defined as alias...
            if (j.relation.alias === columnExpr.column.relationName) {
              // found it
              const tempRelation = j.relation.subquery.compositeSelections[0].relation;
              this.inferTypeForSelection.bind(this)(tempRelation);
              // now access it, should be fine...
              foundColumns = tempRelation.columns;
            }
          });
        }
      }
      if (!foundColumns) {
        ReportDielUserError(`We cannot find the column ${columnExpr.column.columnName} from relation ${columnExpr.column.relationName}`);
      }
      columnFound = foundColumns.filter(c => c.name === columnExpr.column.columnName);
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
    return this.ast.inputs.map(r => fun(r.columns, r.name))
      .concat(this.ast.dynamicTables.map(r => fun(r.columns, r.name)))
      .concat(this.ast.staticTables.map(r =>  fun(r.columns, r.name)));
  }
}