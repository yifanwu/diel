import { DielIr } from "../DielIr";
import { DataType, OriginalRelation, RelationType, RelationSelection, SetOperator, AstType, CompositeSelectionUnit } from "../../parser/dielAstTypes";
import { ExprType, ExprFunAst, FunctionType, ExprValAst, ExprColumnAst } from "../../parser/exprAstTypes";
import { ReportDielUserError, LogInternalError } from "../../lib/messages";

export function getStaticTableFromDerived(r: CompositeSelectionUnit[], relation: string) {
  const originalColumns = r[0].relation.derivedColumnSelections;
  if (!originalColumns) {
    throw new Error(`query not normalized and cannot be distributed to main`);
  }
  const columns = originalColumns.map(c => {
    if (!c.alias) {
      ReportDielUserError(`Must specify alias for view columns, and you did not for ${relation}, with column ${JSON.stringify(c, null, 2)}`);
    }
    if (!c.expr.dataType) {
      LogInternalError(`Didn't specify the data type in the relation ${relation}!`);
    }
    return {
      name: c.alias,
      type: c.expr.dataType,
    };
  });
  let createSpec: OriginalRelation = {
    name: relation,
    relationType: RelationType.EventTable,
    columns
  };
  return createSpec;
}


// only create tables for what outputs depend on
// and intersect that too, just just onestep is fine
export function findOutputDep(ir: DielIr) {
  const depTree = ir.dependencies.depTree;
  const outputDep = new Set<string>();
  ir.GetOutputs().map(o => depTree.get(o.name).dependsOn.map(d => outputDep.add(d)));
  return outputDep;
}

// FIXME: this will invoked for every record, so will not work for multiple insertions
export function generateShipWorkerInputClause(inputName: string): RelationSelection {
    const argInputName: ExprValAst = {
      exprType: ExprType.Val,
      dataType: DataType.String,
      value: inputName
    };
    const argLineage: ExprColumnAst = {
      columnName: "timestep",
      exprType: ExprType.Column,
      dataType: DataType.String,
      relationName: "new",
      hasStar: false
    };
    // FIXME: this function reference is a bit brittle
    const expr: ExprFunAst = {
      exprType: ExprType.Func,
      dataType: DataType.Void,
      functionType: FunctionType.Custom,
      functionReference: "shipWorkerInput",
      args: [argInputName, argLineage]
    };
    const newQuery: RelationSelection = {
      astType: AstType.RelationSelection,
      compositeSelections: [{
        op: SetOperator.NA,
        relation: {
          columnSelections: [{expr}]
        }
      }]
    };
    return newQuery;
}