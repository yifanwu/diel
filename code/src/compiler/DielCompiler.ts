import { DielIr } from "./DielIr";
import { DielAst, DielConfig } from "../parser/dielAstTypes";
import { applyTemplates } from "./passes/applyTemplate";
import { applyCrossfilter } from "./passes/applyCrossfilter";
import { genTs } from "./codegen/codeGenTs";
import { createSqlIr } from "./codegen/createSqlIr";
import { generateSqlFromIr } from "./codegen/codeGenSql";
import { getSelectionUnitDep, getTopologicalOrder } from "./passes/passesHelper";
import { dielIrComplain } from "./errorChecking/errorInfos";

export default class DielCompiler extends DielIr {
  constructor(ast: DielAst, config: DielConfig) {
    super();
    this.ast = ast;
    this.config = config;
    this.buildIndicesToIr();
    // build the tree
    // the follow mismash of this vs passing variable around should be fixed.
    this.getDependnecies();
    applyTemplates(this.ast);
    applyCrossfilter(this.ast);
    this.normalizeConstraints();
    this.normalizeColumnSelection();
    this.inferType();
  }

  /**
   * passing this around, since it's getting rather large...
   */
  async GenerateTs() {
    return genTs(this, this.dependencies.depTree);
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

  // helper
  // recursively checks for dependencies
  oneStep(rName: string, affectedRelations: Set<string>) {
    // search through dependency
    let oldSet = new Set(affectedRelations);
    for (let [key, value] of this.dependencies.depTree) {
      if (value.dependsOn.filter(d => d === rName)) {
        // check if there is anything that depends on this...
        affectedRelations.add(key);
      }
    }
    // set difference
    const diff = new Set([...affectedRelations].filter(x => !oldSet.has(x)));
    if (diff.size > 0) {
      // need to run this on more dependencies
      diff.forEach((v) => {
        this.oneStep(v, affectedRelations);
      });
    }
    return affectedRelations;
  }

  // this is sort of a transitive closure step
  public GenerateDependenciesByInput() {
    const inputDependency = new Map<string, string[]>();
    this.ast.inputs.map(i => {
      const allDependencies = new Set<string>();
      this.oneStep(i.name, allDependencies);
      // filter out the outputs
      const inputDependencyValues: string[] = [];
      allDependencies.forEach(d => {
        if (this.ast.outputs.filter(o => o.name === d)) {
          inputDependencyValues.push(d);
        }
      });
      inputDependency.set(i.name, inputDependencyValues);
    });
    return inputDependency;
  }

  /**
   * constraints can be created either on the column or on the table
   * we will move all to the table level for easier checking
   *   but i think SQL syntax requires some to be written in column leve, e.g., not null
   *   however primary key can be in both positions (presumably because it can take multiple columns)
   *
   * the function will walk through the original tables and move the column level
   *   constraints to relation constraints
   *   and maybe label the field  as "derived"
   *
   * see https://www.sqlite.org/syntax/column-constraint.html
   *     and https://www.sqlite.org/syntax/table-constraint.html
   *
   * we have augmented it so that it could work with views as well
   */
  normalizeConstraints() {
    this.applyToAllExistingRelation((r) => {
      r.columns.map(c => {
        if (c.constraints) {
          if (c.constraints.notNull) {
            if (r.constraints.notNull) {
              r.constraints.notNull.push(c.name);
            } else {
              r.constraints.notNull = [c.name];
            }
          }
          if (c.constraints.unique) {
            if (r.constraints.uniques) {
              r.constraints.uniques.push([c.name]);
            } else {
              r.constraints.uniques = [[c.name]];
            }
          }
          if (c.constraints.primaryKey) {
            if (r.constraints.primaryKey) {
              dielIrComplain(`Cannot have more than one primary key! You already have ${r.constraints.primaryKey} but we are adding ${c.name}`);
            } else {
              r.constraints.primaryKey = [c.name];
            }
          }
        }
      });
    });
  }

  /**
   * the pass removes the .* as well as filling in where the columns comes from if it's not specified
   * - visit by topological order
   * - supports subqueries, e.g., select k.* from (select * from t1) k;
   */
  normalizeColumnSelection() {
    this.applyToAllSelectionUnits(this.normalizeColumnForSelectionUnit.bind(this), true);
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
  inferType() {
    this.applyToAllSelectionUnits(this.inferTypeForSelection.bind(this), true);
  }
}