import { DielIr } from "../DielIr";
import { DielPhysicalExecution, DataType } from "../../parser/dielAstTypes";
import { SqlIr, createSqlIr } from "../codegen/createSqlIr";
import { MetaDataPhysical } from "../../runtime/DielRuntime";
import { TableLocation } from "../../runtime/runtimeTypes";
import { generateDependenciesByName } from "./dependnecy";
import { SetIntersection } from "../../lib/dielUtils";
import { RelationSelection, SetOperator, AstType } from "../../parser/sqlAstTypes";
import { ExprAst, ExprType, ExprFunAst, FunctionType, ExprValAst } from "../../parser/exprAstTypes";


/**
 * assume that this will be the first one executed!
 * - goal: get one worker working
 * - setup: there is a table in one of the workers, and we need to evaluate the query
 * How this works: two passes
 * - pass 1: get dep
 * - pass 2: for all the deps, figure out what table is missing, and ship it over.
 * ASSUMPTION: only distributed to one remote
 * FIXME:
 * - deal with websocket based remotes; e.g., postgres
 * - create async events
 * this already lowers the IR to the SQLIr
 */
export function DistributeQueries(ir: DielIr, metaData: MetaDataPhysical): DielPhysicalExecution {
  // we need to coordinate --- have the click trigger a share, then have the worker
  // listen and send results back, as an event that inserts

  const shippingInfo = new Map<string, Set<number>>();
  const workerDependency = findWorkerDep(ir, metaData);
  workerDependency.forEach((wDep, keyW) => {
    // very inefficient. maybe: Sahana: figure out big O and improve efficiency
    ir.dependencies.inputDependencies.forEach((iDep, keyI) => {
      const intersect = SetIntersection(wDep, iDep);
      if (intersect.size > 0) {
        if (shippingInfo.has(keyI)) {
          shippingInfo.get(keyI).add(metaData.get(keyW).accessInfo);
        } else {
          shippingInfo.set(keyI, new Set<number>([metaData.get(keyW).accessInfo]));
        }
      }
    });
  });

  // for all shippingInfo, add a trigger to the program
  shippingInfo.forEach((v, inputName) => {
    const p = ir.ast.programs.filter(p => p.input === inputName);
    const argInputName: ExprValAst = {
      exprType: ExprType.Val,
      dataType: DataType.String,
      value: inputName
    };
    // FIXME: this function reference is a bit brittle
    const expr: ExprFunAst = {
      exprType: ExprType.Func,
      dataType: DataType.Void,
      functionType: FunctionType.Custom,
      functionReference: "shipWorkerInput",
      args: [argInputName]
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
    if (!p || p.length === 0) {
      ir.ast.programs.push({
        input: inputName,
        queries: [newQuery]
      });
    } else {
      p[0].queries.push(newQuery);
    }
  });
  const workers = new Map<string, SqlIr>();
  const remotes = new Map<string, SqlIr>();
  // for now just stick them all in there...
  // FIXME: not working!
  const main = createSqlIr(ir.ast);
  // now put all the views that contain worker tables out into the respective workers
  // just walk through the depTree and look up their names in the metaData part
  return {
    main,
    workers,
    remotes,
    workerShippingInfo: shippingInfo
  };
}

function findWorkerDep(ir: DielIr, metaData: MetaDataPhysical) {
  // walk through all the views and see if any depends on stuff in worker
  // assume to be in worker for now
  const workerDependency = new Map<string, Set<string>>();
  metaData.forEach((v, r) => {
    // ugh this map array business is so dumb, we should change this into relational formats
    const deps = generateDependenciesByName(ir.dependencies.depTree, r);
    workerDependency.set(r, deps);
  });
  return workerDependency;
}