import { DielIr } from "./DielIr";
import { DielAst, DielConfig } from "../parser/dielAstTypes";
import { applyTemplates } from "./passes/applyTemplate";
import { applyCrossfilter } from "./passes/applyCrossfilter";
import { genTs } from "./codegen/codeGenTs";
import { createSqlIr } from "./codegen/createSqlIr";
import { generateSqlFromIr } from "./codegen/codeGenSql";
import { getSelectionUnitDep, getTopologicalOrder } from "./passes/passesHelper";

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