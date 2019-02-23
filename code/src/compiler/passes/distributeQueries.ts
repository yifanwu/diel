import { DielIr } from "../DielIr";
import { DielPhysicalExecution, DataType, OriginalRelation, OriginalRelationType, DerivedRelationType, DielAst, createEmptyDieAst, DerivedRelation, UdfType, ProgramsIr } from "../../parser/dielAstTypes";
import { SqlIr, SqlRelationType, RelationQuery } from "../codegen/createSqlIr";
import { MetaDataPhysical } from "../../runtime/DielRuntime";
import { generateDependenciesByName } from "./dependnecy";
import { SetIntersection, SetUnion, DeepCopy } from "../../lib/dielUtils";
import { RelationSelection, SetOperator, AstType, CompositeSelectionUnit } from "../../parser/sqlAstTypes";
import { ExprType, ExprFunAst, FunctionType, ExprValAst } from "../../parser/exprAstTypes";
import { ReportDielUserError, LogInternalError } from "../../lib/messages";

/**
 * FIXME: all the logic is a bit convoluted and not performant
 *
 * ASSUMPTIONs:
 * - this is done before caching and materialization
 * - only distributed to one remote
 */
export function DistributeQueries(ir: DielIr, metaData: MetaDataPhysical): DielPhysicalExecution {
  // we need to coordinate --- have the click trigger a share, then have the worker
  // listen and send results back, as an event that inserts

  const workers = new Map<number, DielAst>();
  const remotes = new Map<string, DielAst>();
  const main: DielAst = createEmptyDieAst();

  const workerDependency = findWorkerDep(ir, metaData);
  const mainToWorker = new Map<string, Set<number>>();
  const workerToMain = new Map<number, Set<string>>();

  let mainViews = new Set(ir.ast.views.map((v) => v.name));

  // first copy over the programs & inputs, and views that are not covered by worker...
  // FIXME: deep copy
  main.originalRelations = DeepCopy<OriginalRelation[]>(ir.ast.originalRelations);
  main.udfTypes = DeepCopy<UdfType[]>(ir.ast.udfTypes);
  main.programs = ir.ast.programs && (ir.ast.programs.size > 0) ? DeepCopy<ProgramsIr>(ir.ast.programs) : new Map();

  workerDependency.forEach((wDep, keyW) => {
    const wLoc = metaData.get(keyW).accessInfo;
    const outputDep = findOutputDep(ir);
    const mainCreates = SetIntersection(outputDep, wDep);
    const workerNewViews: DerivedRelation[] = [];
    if (workerToMain.has(wLoc)) {
      workerToMain.set(wLoc, SetUnion(workerToMain.get(wLoc), mainCreates));
    } else {
      workerToMain.set(wLoc, mainCreates);
    }
    for (let d of mainCreates) {
      const r = ir.allDerivedRelations.get(d);
      if (r.relationType !== DerivedRelationType.Output) {
        workerNewViews.push({
          name: d,
          relationType: DerivedRelationType.View,
          selection: r.selection
        });
      }
    }

    // pass these views to workers
    if (!workers.get(wLoc)) {
      workers.set(wLoc, createEmptyDieAst());
    }
    workers.get(wLoc).views = workers.get(wLoc).views.concat(workerNewViews);
    workerNewViews.map(w => mainViews.delete(w.name));
    mainViews.forEach(v => {
      main.views.push(ir.allDerivedRelations.get(v));
    });
    // add the programs to main
    // create tables from these views for main
    for (let d of mainCreates) {
      main.originalRelations.push(getStaticTableFromDerived(ir.allCompositeSelections.get(d), d));
    }
    // create the input relation on main
    // very inefficient. maybe: Sahana: figure out big O and improve efficiency
    // we also need to create the tables for the inputs in the table, except that here, they are just raw definitions, without the additional triggers
    // FIXME: better names
    ir.dependencies.inputDependencies.forEach((iDep, keyI) => {
      const intersect = SetIntersection(wDep, iDep);
      if (intersect.size > 0) {
        workers.get(wLoc).originalRelations = workers.get(wLoc).originalRelations.concat(ir.allOriginalRelations.get(keyI));
        if (mainToWorker.has(keyI)) {
          mainToWorker.get(keyI).add(wLoc);
        } else {
          mainToWorker.set(keyI, new Set<number>([wLoc]));
        }
      }
    });
  });
  mainToWorker.forEach((v, inputName) => {
    const p = main.programs.get(inputName);
    const newClause = generateShipWorkerInputClause(inputName);
    if (p) {
      p.push(newClause);
    } else {
      main.programs.set(inputName, [newClause]);
    }
  });

  return {
    main,
    workers,
    remotes,
    workerToMain,
    mainToWorker
  };
}

function getStaticTableFromDerived(r: CompositeSelectionUnit[], relation: string) {
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
  // FIXME: this will make the dependency diagram obsolete
  let createSpec: OriginalRelation = {
    name: relation,
    relationType: OriginalRelationType.Input,
    columns
  };
  return createSpec;
}

// only create tables for what outputs depend on
// and intersect that too, just just onestep is fine
function findOutputDep(ir: DielIr) {
  const depTree = ir.dependencies.depTree;
  const outputDep = new Set<string>();
  ir.GetOutputs().map(o => depTree.get(o.name).dependsOn.map(d => outputDep.add(d)));
  return outputDep;
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

function generateShipWorkerInputClause(inputName: string): RelationSelection {
  // for all shippingInfo, add a trigger to the program
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
    return newQuery;
    // if (!p || p.length === 0) {
    //   ir.ast.programs.push({
    //     input: inputName,
    //     queries: [newQuery]
    //   });
    // } else {
    //   p[0].queries.push(newQuery);
    // }
  // });
}