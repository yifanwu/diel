import { ANTLRInputStream, CommonTokenStream } from "antlr4ts";
import initSqlJs from "sql.js";
// import { Database, Statement, QueryResults } from "sql.js";

import { DIELLexer } from "../parser/grammar/DIELLexer";
import { DIELParser } from "../parser/grammar/DIELParser";

import { DielRemoteAction, RelationObject, DielConfig, TableMetaData, DbType, RecordObject, RemoteShipRelationMessage, RemoteUpdateRelationMessage, RemoteExecuteMessage, ExecutionSpec, } from "./runtimeTypes";
import { OriginalRelation, RelationType, SelectionUnit, DbIdType, LogicalTimestep, RelationNameType, DerivedRelation, DielAst, BuiltInColumn, Relation, Optional, RelationReferenceType, RelationReferenceSubquery, RelationSelection, RelationReference, RelationReferenceDirect, RelationOrigin } from "../parser/dielAstTypes";
import { SqlStrFromSelectionUnit, generateInsertClauseStringForValue, generateStringFromSqlIr, generateDrop, generateCleanUpAstFromSqlAst, GenerateSqlRelationString, GetSqlStringFromCompositeSelectionUnit } from "../compiler/codegen/codeGenSql";
import Visitor from "../parser/generateAst";
import { CompileAst, CompileDerivedAstGivenAst } from "../compiler/compiler";
import { log } from "../util/dielUdfs";
import { downloadHelper, CheckObjKeys } from "../util/dielUtils";
import { LogInternalError, LogTmp, ReportUserRuntimeError, LogInternalWarning, ReportUserRuntimeWarning, ReportDielUserError, UserErrorType, PrintCode, LogInfo, LogExecutionTrace } from "../util/messages";
import { SqlJsGetObjectArrayFromQuery, processSqlMetaDataFromRelationObject, ParseSqlJsWorkerResult, GenerateViewName, CaughtLocalRun, convertRelationObjectToQueryResults } from "./runtimeHelper";
import { materializationTime, DielPhysicalExecution, LocalDbId, dependsOnLocalTables, dependsOnRemoteTables } from "../compiler/DielPhysicalExecution";
import DbEngine, { DbDriver } from "./DbEngine";
import { checkViewConstraint } from "../compiler/passes/generateViewConstraints";
import { StaticSql } from "../compiler/codegen/staticSql";
import { ParsePlainSelectQueryAst } from "../compiler/compiler";
import { GetSqlRelationFromAst, GetDynamicRelationsColumns } from "../compiler/codegen/SqlAstGetters";
import { SqlOriginalRelation, SqlRelationType, SqlDerivedRelation, SqlAst } from "../parser/sqlAstTypes";
import { DeriveDependentRelations, getRelationReferenceDep } from "../compiler/passes/dependency";
import { GetAllOutputs, GetRelationDef, DeriveColumnsFromRelation, IsRelationTypeDerived } from "../compiler/DielAstGetters";
import { getEventViewCacheName, getEventViewCacheReferenceName } from "../compiler/passes/distributeQueries";
import { execTime } from "./ConnectionWrapper";

// ugly global mutable pattern here...
export let STRICT = false;
export let LOGINFO = false;

// variables to measure..
export let setupTime = 0;
export let setupMainDbTime = 0;
export let setupRemoteTime = 0;
export let initialCompileTime = 0;
export let setupUDFsTime = 0;
export let physicalExecutionTime = 0;
export let executeToDBsTime = 0;
const printTimes = true; // Used for performance analysis

const locateFile = (pathname: any) => {
  if (pathname === "sql-wasm.wasm") {
    return require("../../node_modules/sql.js/dist/sql-wasm.wasm");
  }
  throw new Error(`Unhandled locate path: ${pathname}`);
};
const config = {
  locateFile
};

// FIXME: the new export pattern for sql.js is so weird.
type Database = any;
type Statement = any;
type QueryResults = any;

export const INIT_TIMESTEP = 1;

export const SqliteMasterQuery = `
  SELECT sql, name
  FROM sqlite_master
  WHERE type='table'
    AND sql not null
    AND name != 'sqlite_sequence'`;

type ReactFunc = (v: any) => void;

type TickBind = {
  outputName: string,
  uiUpdateFunc: ReactFunc,
};

class ViewConstraintQuery {
  viewName: string;
  queries: string[][];
}

export type MetaDataPhysical = Map<string, TableMetaData>;
type DbMetaData = {
  dbType: DbType;
  dbDriver?: DbDriver;
};

export type PhysicalMetaData = {
  // RYAN: TODO: Find better place for this.
  cache?: boolean,
  materialize?: boolean,
  dbs: Map<DbIdType, DbMetaData>;
  relationLocation: Map<string, TableMetaData>;
};

export type RelationShippingFuncType = (view: string, o: RelationObject, requestTimestep?: number) => void;

export default class DielRuntime {
  timestep: LogicalTimestep;
  eventByTimestep: Map<LogicalTimestep, RelationNameType>;
  ast: DielAst;
  physicalExecution: DielPhysicalExecution;
  dbEngines: Map<DbIdType, DbEngine>;
  physicalMetaData: PhysicalMetaData;
  config: DielConfig;
  staticRelationsSent: {static: RelationNameType, output: RelationNameType}[];
  db: Database;
  scales: RelationObject;
  visitor: Visitor;
  constraintQueries: Map<string, ViewConstraintQuery>;
  checkConstraints: boolean;
  protected boundFns: TickBind[];
  protected runtimeOutputs: Map<string, Statement>;
  protected runtimeInputs: Map<string, {stmt: Statement, columnNames: string[]}>;
  cache: Map<string, LogicalTimestep>;

  constructor(config: DielConfig) {
    const startSetUpTime = performance.now();
    if (typeof window !== "undefined") {
      (<any>window).diel = this; // for debugging
    }
    // mutate global for logging
    STRICT = config.isStrict ? config.isStrict : false;
    LOGINFO = config.showLog ? config.showLog : false;
    if (!LOGINFO) {
      console.log = () => {};
    }
    this.timestep = INIT_TIMESTEP;
    this.config = config;
    this.eventByTimestep = new Map();
    this.visitor = new Visitor();
    this.constraintQueries = new Map();
    this.checkConstraints = true;
    this.dbEngines = new Map();
    this.runtimeOutputs = new Map();
    this.physicalMetaData = {
      dbs: new Map(),
      relationLocation: new Map(),
      cache: config.caching ? config.caching : false,
      materialize: config.materialize ? config.materialize : false,
    };
    this.staticRelationsSent = [];
    this.boundFns = [];
    this.runOutput = this.runOutput.bind(this);
    this.BindOutput = this.BindOutput.bind(this);
    this.setup(config.setupCb, startSetUpTime);
  }

  getEventByTimestep(timestep: LogicalTimestep) {
    return this.eventByTimestep.get(timestep);
  }


  public ShutDown() {
    this.db.close();
    this.dbEngines.forEach(e => {
      e.Close();
      // close
    });
  }

  /**
   * When the notebook invokes BindOutput it can invoke the data to be evaluated
   * @param outputName
   * @param reactFn
   * @param triggerEval
   */
  public BindOutput(outputName: string, reactFn: ReactFunc): void {
    if (!this.runtimeOutputs.has(outputName)) {
      ReportUserRuntimeError(`output not defined ${outputName}, from current outputs of: [${Array.from(this.runtimeOutputs.keys()).join(", ")}]`);
    }
    this.boundFns.push({outputName: outputName, uiUpdateFunc: reactFn });
    // the goal here is to tug on all the events so that the event views that outputs depend on will be shared
    // without any initial interactions
    const staticTriggers = this.physicalExecution.getStaticAsyncViewTrigger(outputName);
    // const staticTriggers = SetDifference(new Set(staticTriggersRaw.map(t => t.relation)), );
    // static triggers should be done just once...
    if (staticTriggers && (staticTriggers.length > 0)) {
      LogInfo(`Sending triggers for async static output: ${outputName}`, staticTriggers);
      for (let i = 0; i < staticTriggers.length; i++) {
        const t = staticTriggers[i];
        if (this.staticRelationsSent.find(s => (s.static === t.relation) && (s.output === outputName))) {
          console.log("seen this before", t.relation, outputName);
          continue;
        }
        const staticShip = this.physicalExecution.getBubbledUpRelationToShipForStatic(t.dbId, t.relation, outputName);
        console.log("staticShip result", staticShip);
        const rDb = this.findRemoteDbEngine(t.dbId);
        staticShip.map(t => {
          const staticMsg: RemoteShipRelationMessage = {
            remoteAction: DielRemoteAction.ShipRelation,
            relationName: t.relation,
            dbId: t.destination,
            requestTimestep: this.timestep,
          };
          rDb.SendMsg(staticMsg);
        });
        // const msg: RemoteShipRelationMessage = {
        //   remoteAction: DielRemoteAction.ShipRelation,
        //   relationName: t.relation,
        //   outputName: outputName,
        //   dbId: t.dbId,
        //   requestTimestep: INIT_TIMESTEP
        // };
        // const rDb = this.findRemoteDbEngine(t.dbId);
        // if (!rDb) return LogInternalError(`${t.dbId} not found`);
        // rDb.SendMsg(msg);
        this.staticRelationsSent.push({static: t.relation, output: outputName});
      }
    }
    // then evaluate the local view
    this.runOutput({outputName, uiUpdateFunc: reactFn});
  }

  /**
   * GetView need to know if it's dependent on an event table
   *   in which case it will go and fetch the depdent events which are NOT depent on inputs
   *   it will also remember if this was done before
   *   add these special cases into physical execution logic
   * @param view
   */
  public GetView(view: string): RelationObject {
    return this.simpleGetLocal(view);
  }

  // verbose just to make sure that the exported type is kept in sync
  public NewInputMany: RelationShippingFuncType = (view: string, o: any, requestTimestep?: number) => {
    requestTimestep = requestTimestep ? requestTimestep : this.timestep;
    this.newInputHelper(view, o, requestTimestep);
  }

  public NewInput(i: string, o: any, requestTimestep?: number) {
    requestTimestep = requestTimestep ? requestTimestep : this.timestep;
    LogInfo(`New input ${requestTimestep ? `at ${requestTimestep}` : ""}`, JSON.stringify(o));
    this.newInputHelper(i, [o], requestTimestep);
  }

  private makeSubKey(r: RelationReference) {
    if (r.relationReferenceType === RelationReferenceType.Direct) {
      let relation = (r as RelationReferenceDirect).relationName;
      // we need to filter out the time related fields if they are not used
      let query = `select * from ${relation}`;
      console.log(`    Hashing "${query}" for caching`);
      return JSON.stringify(this.ExecuteStringQuery(query));
    } else {
      let subqry = (r as RelationReferenceSubquery).subquery;
      let hash = "";
      subqry.compositeSelections.forEach(c => {
          let query = GetSqlStringFromCompositeSelectionUnit(c);
          console.log(`    Hashing "${query}" for caching`);
          hash += JSON.stringify(this.ExecuteStringQuery(query));
      });
      return hash;
    }
  }

  /**
   * Improvements: could be smarter
   * @param eventView
   */
  private getCacheKey(eventView: string) {
    let rDef = GetRelationDef(this.ast, eventView) as DerivedRelation;

    let selections: RelationReference[] = [];

    let mainSelection = rDef.selection.compositeSelections[0].relation;

    // RYAN TODO: if baseRelation undefined? Also check in other places for this.
    selections.push(mainSelection.baseRelation);

    mainSelection.joinClauses.forEach(j => {
      selections.push(j.relation);
    });

    let key = "";

    selections.forEach(s => {
      if (dependsOnLocalTables(getRelationReferenceDep(s), this.physicalMetaData.relationLocation)) {
        key += ";" + this.makeSubKey(s);
      }
    });

    return key;
  }

  /**
   * Returns the requestTimestep corresponding to the cached requestTimestep.
   * If cache miss, will return the requestTimestep passed in.
   * @param eventView
   * @param requestTimestep
   */
  private getFromCacheOrMiss(eventView: string, requestTimestep: LogicalTimestep): LogicalTimestep {
    let key = this.getCacheKey(eventView);
    let cachedRequestTimestep = this.cache.get(key);
    if (cachedRequestTimestep === undefined) {
      console.log(`    Cache miss for local dependencies of ${eventView}.`);
      this.cache.set(key, requestTimestep);
      return requestTimestep;
    }
    console.log(`    Cache hit for ${eventView}: cached requestTimestep is ${requestTimestep}`);
    return cachedRequestTimestep;
  }

  private newInputHelper(eventName: string, objs: any[], requestTimestep: number) {
    // start of tick
    this.timestep++;
    this.runtimeInputs.get("logTime").stmt.run({
      $timestep: this.timestep,
      $kind: "begin",
      $ts: performance.now()
    });
    this.eventByTimestep.set(this.timestep, eventName);
    // we should get the definition from the local SQL definitions...
    const caching = this.config.caching && this.GetRelationDef(eventName).relationType === RelationType.EventView;
    const inputEvent = caching
      ? getEventViewCacheName(eventName)
      : eventName
      ;

    const builtIn: {[index: string]: number} = {
      TIMESTEP: this.timestep,
      REQUEST_TIMESTEP: requestTimestep,
      ORIGINAL_REQUEST_TIMESTEP: requestTimestep
    };

    // set the values
    objs.map(o => {
      const value: {[index: string]: number | string} = {};
      // note that we need to filter out the built in columns
      //   because they are provided by US, not the input object
      // filter(c => !(c in BuiltInColumn))
      this.runtimeInputs.get(inputEvent).columnNames.map(cName => {
        const builtInValue = builtIn[cName];
        if (builtInValue) {
          value[`$${cName}`] = builtInValue;
          return;
        } else {
          const raw = o[cName];
          // it can be explicitly set to null, but not undefined
          if (raw === undefined) {
            ReportUserRuntimeError(`We expected the input ${cName}, but it was not defined for ${eventName} in the object ${JSON.stringify(objs, null, 2)}.`);
          } else {
            value[`$${cName}`] = raw;
          }
          return;
        }
      });
      this.runtimeInputs.get(inputEvent).stmt.run(value);
    });

    this.runtimeInputs.get("allInput").stmt.run({
      $timestep: this.timestep,
      $inputRelation: inputEvent,
      $timestamp: Date.now(),
      $request_timestep: requestTimestep
    });

    // Factored out so we can repeat
    const relationsDependentOnCurrentEvent = DeriveDependentRelations(this.ast.depTree, eventName);
    if (!relationsDependentOnCurrentEvent) {
      return LogInternalWarning(`Input ${eventName} as not dependencies`);
    }
    const notCachedViews = this.checkAndApplyCache(eventName, relationsDependentOnCurrentEvent, this.timestep);
    // must be ran after cache for cached views to be in effect for the current timestep
    this.runOutputsGivenNewInputForEvent(relationsDependentOnCurrentEvent);
    LogExecutionTrace(`notCachedViews are`, JSON.stringify(notCachedViews));
    if (notCachedViews.length > 0) {
      this.shipWorkerInput(eventName, notCachedViews, this.timestep);
    }
    return 0;
  }

  private runOutputsGivenNewInputForEvent(inputDep: Set<RelationNameType>) {
    // there should be a step here to check for caching, because if it's cached it should be in the same timestep!

    this.boundFns.map(b => {
      if (inputDep.has(b.outputName)) {
        this.runOutput(b);
      }
    });

    this.runtimeInputs.get("logTime").stmt.run({
      $timestep: this.timestep,
      $kind: "end",
      $ts: performance.now()
    });
  }

  /**
   * this is the execution logic
   *   where we do distributed query execution
   *   and possibly materialization (basically can be in SQL triggers or our own even handling layer)
   */
  runOutput(b: TickBind) {
    const r = this.simpleGetLocal(b.outputName);
    if (r) {
      b.uiUpdateFunc(r);
      this.constraintChecking(b.outputName);
    }
    return;
  }

  /**
   * Check view constraints afresh and report if broken
   */
  constraintChecking(viewName: string) {
    // TODO. Check view constraint for nested views. currently, it only checks output view.
    // only check if checking mode is turned on
    if (this.checkConstraints) {
      if (this.constraintQueries.has(viewName)) {
        let queryObject = this.constraintQueries.get(viewName);
        if (queryObject) {
          let queries = queryObject.queries;
          // run the entire constraint quries for that view
          queries.map(ls => {
            this.reportConstraintQueryResult(ls[0], viewName, ls[1]);
          });
        }
      }
    }
  }

  downloadDB(dbId?: DbIdType, fileName?: string) {
    if ((!dbId) || (dbId === LocalDbId)) {
      let dRaw = this.db.export();
      let blob = new Blob([dRaw]);
      const fName = fileName ? fileName : "session";
      downloadHelper(blob, fName);
    } else {
      const remote = this.dbEngines.get(dbId);
      if (remote) {
        remote.downloadDb();
      }
    }
  }

  /**
   * Calling in this the browser will download a CSV with performance times
   */
  downloadPerformance() {

      const blob = new Blob(["setupTime, setupMainDbTime, setupRemoteTime, initialCompileTime, setupUDFsTime, physicalExecutionTime, executeToDBsTime, materializationTime, execTime\n",
      `${setupTime}, ${setupMainDbTime}, ${setupRemoteTime}, ${initialCompileTime}, ${setupUDFsTime}, ${physicalExecutionTime}, ${executeToDBsTime}, ${materializationTime}, ${execTime}`],
      {type: "text/csv;charset=utf-8"});

    downloadHelper(blob, "performance", "csv");
  }

  simpleGetLocal(view: string): RelationObject | null {
    const s = this.runtimeOutputs.get(view);
    if (s) {
      s.bind({});
      let r = [];
      while (s.step()) {
        r.push(s.getAsObject());
      }
      if (r.length > 0) {
        return r;
      } else {
        return ReportUserRuntimeWarning(`${view} did not return any results.`);
      }
    } else {
      return ReportUserRuntimeError(`${view} does not exist.`);
    }
  }

  private async setup(loadPage: () => void, startSetUpTime: number) {
    const setupStart = performance.now();
    console.log(`Setting up DielRuntime with ${JSON.stringify(this.config)}`);

    const setupMainDbStart = performance.now();
    await this.setupMainDb();
    const setupMainDbEnd = performance.now();

    const setupRemoteStart = performance.now();
    await this.setupRemotes();
    const setupRemoteEnd = performance.now();

    const initialCompileStart = performance.now();
    await this.initialCompile();
    const initialCompileEnd = performance.now();

    const setupUDFsStart = performance.now();
    this.setupUDFs();
    const setupUDFsEnd = performance.now();

    const physicalExecutionStart = performance.now();
    this.physicalExecution = new DielPhysicalExecution(
      this.ast,
      this.physicalMetaData,
      this.getEventByTimestep.bind(this),
      this.AddRelation.bind(this)
    );
    const physicalExecutionEnd = performance.now();

    const executeToDBsStart = performance.now();
    await this.executeToDBs();
    const executeToDBsEnd = performance.now();

    this.setupNewInput();
    GetAllOutputs(this.ast).map(o => this.setupNewOutput(o.rName));
    this.scales = ParseSqlJsWorkerResult(this.db.exec("select * from __scales"));

    this.cache = new Map();
    const endSetUpTime = performance.now();
    this.runtimeInputs.get("logTime").stmt.run({
      $timestep: 0,
      $kind: "begin",
      $ts: startSetUpTime,
    });
    this.runtimeInputs.get("logTime").stmt.run({
      $timestep: 0,
      $kind: "end",
      $ts: endSetUpTime,
    });
    loadPage();

    const setupEnd = performance.now();

    if (printTimes) {
      setupTime = setupEnd - setupStart;
      setupMainDbTime = setupMainDbEnd - setupMainDbStart;
      setupRemoteTime = setupRemoteEnd - setupRemoteStart;
      initialCompileTime = initialCompileEnd - initialCompileStart;
      setupUDFsTime = setupUDFsEnd - setupUDFsStart;
      physicalExecutionTime = physicalExecutionEnd - physicalExecutionStart;
      executeToDBsTime = executeToDBsEnd - executeToDBsStart;
    }
  }

  async initialCompile() {
    this.visitor = new Visitor();
    // main db get metadata
    const tableDefinitions = SqlJsGetObjectArrayFromQuery(this.db, SqliteMasterQuery);
    tableDefinitions.map(m => {
      const name = m["name"].toString();
      if (this.physicalMetaData.relationLocation.has(name)) {
        LogInternalError(`DBs should not have the same table names`);
      } else {
        this.physicalMetaData.relationLocation.set(name, {
          dbId: LocalDbId
        });
      }
    });
    this.physicalMetaData.dbs.set(LocalDbId, {dbType: DbType.Local, dbDriver: DbDriver.SQLite});
    let code = processSqlMetaDataFromRelationObject(tableDefinitions, "main");
    const promises: Promise<{id: DbIdType, data: RecordObject[]}>[] = [];
    this.dbEngines.forEach((db) => {
      this.physicalMetaData.dbs.set(db.id, {dbType: db.config.dbType, dbDriver: db.config.dbDriver});
      promises.push(db.getMetaData(db.id));
    });
    const metadatas = await Promise.all(promises);
    // const allDielRelations = this.ir.GetAllRelationNames();
    metadatas.map(mD => {
      code += processSqlMetaDataFromRelationObject(mD.data, mD.id.toString());
      // .map(m => m["sql"] + ";").join("\n");

      // get where each relation is stored (which dbid) from metadata
      mD.data.map(m => {
        const name = m["name"].toString();
        if (this.physicalMetaData.relationLocation.has(name)) {
          LogInternalError(`DBs should not have the same table names`);
        } else {
          this.physicalMetaData.relationLocation.set(name, {
            dbId: mD.id
          });
        }
      });
    });

    // get the static ones
    code += StaticSql;
    for (let i = 0; i < this.config.dielFiles.length; i ++) {
      const f = this.config.dielFiles[i];
      code += await (await fetch(f)).text();
    }
    PrintCode(code);
    const inputStream = new ANTLRInputStream(code);
    const p = new DIELParser(new CommonTokenStream(new DIELLexer(inputStream)));
    const tree = p.queries();
    let ast = this.visitor.visitQueries(tree);
    this.ast = CompileAst(ast);

    console.log("original ast");
    console.log(ast);

    // get sql for views constraints
    checkViewConstraint(ast).forEach((queries: string[][], viewName: string) => {
      if (queries.length > 0) {
        let viewConstraint = new ViewConstraintQuery();
        viewConstraint.viewName = viewName;
        viewConstraint.queries = queries;
        this.constraintQueries.set(viewName, viewConstraint);
      }
    });
    // test the IR here
  }

  async setupRemotes() {
    const inputCallback = this.NewInputMany.bind(this);
    let counter = LocalDbId;
    const dbWaiting = this.config.dbConfigs
      ? this.config.dbConfigs.map(config => {
        counter++;
        const remote = new DbEngine(config, counter, inputCallback);
        this.dbEngines.set(counter, remote);
        return remote.setup();
      })
      : [];
    // const workerWaiting = this.config.workerConfigs
    //   ? this.config.workerConfigs.map(config => {
    //     counter++;
    //     const remote = new DbEngine(DbType.Worker, counter, inputCallback);
    //     this.dbEngines.set(counter, remote);
    //     return remote.setup(config);
    //   })
    //   : [];
    // const socketWaiting = this.config.socketConfigs
    //   ? this.config.socketConfigs.map(config => {
    //     counter++;
    //     const remote = new DbEngine(DbType.Socket, counter, inputCallback);
    //     this.dbEngines.set(counter, remote);
    //     return remote.setup(config);
    //   })
    //   : [];
    await Promise.all(dbWaiting);
    return;
  }

  public AddUDF(fName: string) {
    // a bit hacky
    this.db.create_function(fName, (window as any)[fName]);
  }
  private setupUDFs() {
    this.db.create_function("log", log);
  }

  /**
   * returns false if caching is not enabled or that it's a cache miss
   * - if the cache misses, then ship to everywhere
   * - if cache does not miss, then insert into reference directly (not an event)
   * -   we have to do this for every view because the same view might be triggered by multiple inputs
   * @param inputName
   * @param timestep
   */
  checkAndApplyCache(eventName: RelationNameType, relationsDependentOnCurrentEvent: Set<RelationNameType>, timestep: number): RelationNameType[] {
    const eventViews: RelationNameType[] = [];
    relationsDependentOnCurrentEvent.forEach(dep => {
      const isEventView = dependsOnRemoteTables(this.ast.depTree.get(dep).dependsOn, this.physicalMetaData.relationLocation);
      if (isEventView) eventViews.push(dep);
    });
    if (!this.config.caching) return eventViews;
    console.log(`Caching enabled, so determining whether we need to ship ${eventName}`);

    const notCachedViews: RelationNameType[] = [];
    eventViews.map(eventView => {
      const requestTimestep = this.getFromCacheOrMiss(eventView, timestep);
      // we need to insert this into the cache table
      // but NOT advance the timestep
      const referenceRelation = getEventViewCacheReferenceName(eventView);
      const query = `insert into ${referenceRelation} (REQUEST_TIMESTEP, ORIGINAL_REQUEST_TIMESTEP) values (${timestep}, ${requestTimestep})`;
      this.db.run(query);
      if (requestTimestep < timestep) {
        LogExecutionTrace(`    Cached ${eventView}`);
      } else {
        // we have to wait for the result...
        notCachedViews.push(eventView);
        LogExecutionTrace(`    NOT cached ${eventView}`);
      }
    });
    return notCachedViews;
  }

  /**
   * @param inputName
   * @param timestep
   */
  shipWorkerInput(inputName: string, notCachedViews: RelationNameType[] , timestep: number) {
    const remotesToShipTo = this.physicalExecution.getBubbledUpRelationToShipForEvent(LocalDbId, inputName, notCachedViews);
    // FIXME: we can improve performance by grouping by the views to ship so that they are not evaluated multiple times.
    if (remotesToShipTo && remotesToShipTo.length > 0) {
      remotesToShipTo.map(t => {
        const rDef = GetRelationDef(this.ast, t.relation);
        const columns = DeriveColumnsFromRelation(rDef);
        const shareQuery = `select ${columns.map(c => c.cName).join(", ")} from ${t.relation}`;
        let tableRes = this.db.exec(shareQuery)[0];
        if ((!tableRes) || (!tableRes.values)) {
          LogInternalWarning(`Query ${shareQuery} has NO result`);
          return;
        }
        // FIXME: have more robust typing instead of quoting everything; look up types...
        const values = tableRes.values.map((d: any[]) => `(${d.map((v: any) => (v === null) ? "null" : `'${v}'`).join(", ")})`);
        let sql = `
          DELETE from ${t.relation};
          INSERT INTO ${t.relation} VALUES ${values};
        `;
        const updateMsg: RemoteUpdateRelationMessage = {
          remoteAction: DielRemoteAction.UpdateRelation,
          relationName: t.relation,
          requestTimestep: timestep,
          sql
        };
        this.dbEngines.get(t.destination).SendMsg(updateMsg);
      });
    }
  }

  private findRemoteDbEngine(remoteId: DbIdType) {
    const r = this.dbEngines.get(remoteId);
    if (!r) LogInternalError(`Remote ${remoteId} not found`);
    return r;
  }

  /**
   * returns the DIEL code that will be ran to register the tables
   */
  private async setupMainDb() {
    // console.log("initSqlJs is:", initSqlJs);
    const SQL = await initSqlJs();
    if (!this.config.mainDbPath) {
      this.db = new SQL.Database();
    } else {
      const response = await fetch(this.config.mainDbPath);
      const bufferRaw = await response.arrayBuffer();
      const buffer = new Uint8Array(bufferRaw);
      this.db = new SQL.Database(buffer);
    }
    const d = new Date();
    const n = d.getMilliseconds();
    console.log("FINISHED SETTING UP MAIN DB " + n);
    return;
  }
  /**
   * output tables HAVE to be local tables
   *   since they are synchronous --- if they are over other tables
   *   it would be handled via some trigger programs
   * FIXME: just pass in what it needs, the name str
   */
  private setupNewOutput(rName: string) {
    console.log("setting up new output", rName);
    const q = `select * from ${rName}`;
    this.runtimeOutputs.set(
      rName,
      this.dbPrepare(q)
    );
  }

  // what's dynamic is read from the local AST...
  private setupNewInput() {
    this.runtimeInputs = new Map();
    const localSqlAst = this.physicalExecution.getAstFromDbId(LocalDbId);
    const inputSqlAsts = localSqlAst.relations.filter(r => r.isDynamic);
    inputSqlAsts.map(eRaw => {
      const e = eRaw as SqlOriginalRelation;
      const columnNames = e.columns.map(c => c.cName);
      const q = `insert into ${e.rName} values (${columnNames.map(c => `$${c}`).join(", ")})`;
      this.runtimeInputs.set(e.rName,
        {
          stmt: this.dbPrepare(q),
          columnNames
        }
      );
    });

    this.runtimeInputs.set("allInput",
      {
        stmt: this.db.prepare(`insert into allInputs (timestep, inputRelation, timestamp, request_timestep) values ($timestep, $inputRelation, $timestamp, $request_timestep)`),
        columnNames: ["timestep", "inputRelation", "timestamp", "request_timestep"]
    });

    this.runtimeInputs.set("logTime",
      {
        stmt: this.db.prepare(`insert into __perf values ($timestep, $kind, $ts)`),
        columnNames: ["timestep", "kind", "ts"]
      });

  }

  private dbPrepare(q: string) {
    try {
      return this.db.prepare(q);
    } catch (e) {
      LogInternalError(`Got ${e} while preparing for query ${q}`);
      return null;
    }
  }

  /**
   * returns the results as an array of objects (sql.js)
   */
  ExecuteSqlAst(ast: SelectionUnit): RelationObject {
    const queryString = SqlStrFromSelectionUnit(ast);
    return this.ExecuteStringQuery(queryString);
  }

  ExecuteStringQuery(q: string): RelationObject {
    let r: RelationObject = [];
    // fixme: better types
    this.db.each(q, (row: any) => { r.push(row as RecordObject); }, () => {});
    return r;
  }

  async incrementalExecuteToDb(instructions: ExecutionSpec) {
    const promises: Promise<any>[] = [];
    instructions.map(i => {
      if (i.dbId === LocalDbId)  {
        // const sqlAst = CreateUnitSqlFromUnitDiel(, false);
        const sqlStr = GenerateSqlRelationString(i.relationDef);
        CaughtLocalRun(this.db, sqlStr);
      } else {
        // FIXME: think about replacement logic
        const sqlStr = GenerateSqlRelationString(i.relationDef);
        const remoteInstance = this.findRemoteDbEngine(i.dbId);
        if (remoteInstance) {
          // just to be sure
          // FIXME: this is kinda redundant...
          remoteInstance.setPhysicalExecutionReference(this.physicalExecution);
          const msg: RemoteExecuteMessage = {
            remoteAction: DielRemoteAction.DefineRelations,
            requestTimestep: INIT_TIMESTEP,
            sql: sqlStr,
          };
          const mPromise = remoteInstance.SendMsg(msg, true);
          promises.push(mPromise);
        }
      }
    });
    await Promise.all(promises);
    return;
  }

  // takes in the SqlIrs in different environments and sticks them into the databases
  // FIXME: better async handling
  async executeToDBs() {
    LogTmp(`Executing queries to db`);
    // now execute to worker!
    const promises: Promise<any>[] = [];
    this.physicalExecution.sqlAstSpecPerDb.forEach((ast, id) => {
      if (id === LocalDbId) {
        const queries = generateStringFromSqlIr(ast, false);
        for (let s of queries) {
          CaughtLocalRun(this.db, s);
        }
      } else {
        const remoteInstance = this.findRemoteDbEngine(id);
        if (remoteInstance) {
          remoteInstance.setPhysicalExecutionReference(this.physicalExecution);
          const replace = remoteInstance.config.dbType === DbType.Socket;
          const queries = generateStringFromSqlIr(ast, replace, remoteInstance.config.dbDriver);
          if (queries && queries.length > 0) {
            const sql = queries.map(q => q + ";").join("\n");
            const msg: RemoteExecuteMessage = {
              remoteAction: DielRemoteAction.DefineRelations,
              requestTimestep: INIT_TIMESTEP,
              sql,
            };
            const mPromise = remoteInstance.SendMsg(msg, true);
            if (mPromise) promises.push(mPromise);
          }
          const deleteQueryAst = generateCleanUpAstFromSqlAst(ast);
          const deleteQueries = deleteQueryAst.map(d => generateDrop(d, remoteInstance.config.dbDriver)).join("\n");
          console.log(`%c Cleanup queries:\n${deleteQueries}`, "color: blue");
          if ((remoteInstance.config.dbType === DbType.Socket) && deleteQueries) {
            const msg: RemoteExecuteMessage = {
              remoteAction: DielRemoteAction.CleanUpQueries,
              requestTimestep: INIT_TIMESTEP,
              sql: deleteQueries,
            };
            remoteInstance.SendMsg(msg, false);
          }
        } else {
          LogInternalError(`Remote ${id} is not found!`);
        }
      }
    });
    await Promise.all(promises);
    return;
  }

  // TODO: use component to do namespacing
  // this should really not be part of the runtime --- should more be part of DIEL-UI?
  public GetScales(output: string, component?: string) {
    let result;
    if (component) {
      result = this.scales.filter(s => s.component === component && s.output === output);
    }
    result = this.scales.filter(s => s.outputName === output);
    if (!result || result.length === 0) {
      ReportDielUserError(`Scale not defined for ${output} ${component ? `for compoenetn ${component}` : ""}`, UserErrorType.UndefinedScale);
    } else if (result.length > 1) {
      ReportUserRuntimeWarning(`Output ${output} used for multiple ${component ? `for compoenetn ${component}` : ""}`);
    }
    const rawValue = result[0];
    if (CheckObjKeys(["dimension", "x", "y", "z"], rawValue)) {
      return rawValue as {dimension: number, x: string, y?: string, z?: string};
    } else
      LogInternalError(`scale logic inconsistent`);
      return null;
  }

  /**
   * Returns the name of derived view (which will be auto generated if not specified)
   * @param q: the raw query string
   * @param rName: the relation name
   */
  public async AddOutputRelationByString(q: string, rName?: string) {
    const relationSelection = ParsePlainSelectQueryAst(q);
    rName = rName ? rName : GenerateViewName(relationSelection);
    const derived: DerivedRelation = {
      rName,
      relationType: RelationType.Output,
      selection: relationSelection
    };
    await this.AddViewByAst(derived);
    return rName;
  }

  public AddRelation(r: Relation) {
    const find = this.ast.relations.findIndex(oldR => r.rName === oldR.rName);
    if (IsRelationTypeDerived(r.relationType)) {
      if (find > -1) {
        if (r.replaces) {
          this.DeleteView(find);
        } else {
          // the distributed execution might attempt multiple times for the same thing
          // just ignore for now
          return LogInternalWarning(`You are defining something already defined ${r.rName}`);
        }
      }
      this.AddViewByAst(r as DerivedRelation);
    } else {
      if (find > -1) {
        return LogInternalWarning(`You are defining something already defined ${r.rName}`);
      }
      this.AddOriginalTableByAst(r as OriginalRelation);
    }
    return null;
  }

  public DeleteView(foundIdx: number) {
    // take it off
    // and keep it if it were user created
    const r = this.ast.relations[foundIdx];
    if (r.origin === RelationOrigin.User) {
      // only save it if it were the original thing
      this.ast.replacedRelations.push(r);
    }
    this.ast.relations.splice(foundIdx, 1);
    // also need to remove them from the dependency tree
    this.physicalExecution.RemoveDerivedAst(r as DerivedRelation);
    // TODO: also from the executions in other DBs that have been shipped...
    return;
  }

  public async AddOriginalTableByAst(rDef: OriginalRelation) {
    // we don't need to compile it...
    // note that the dependency tree will be fixed once we add derived views
    //   so not modified here.
    this.ast.relations.push(rDef);
  }

  public async AddTemplateByString(q: string) {

  }

  // this is accessed by the Notebook to reason with he ASTs
  // if this was an output view on an async event, then we need to access the underlying event...
  // so it has to be from the DIEL ast and not SQL ast
  public GetRelationDef(rName: string) {
    return GetRelationDef(this.ast, rName);
  }

  /**
   * Note that the AST here need not be typed or de-stared
   * It's fine if they are.
   * #OPTIMIZE: In the future, we can skip some of the compiling steps if its already normalized
   */
  public async AddViewByAst(derived: DerivedRelation) {
    const compiledAst = CompileDerivedAstGivenAst(this.ast, derived);
    // physical execution need to also maintain some metadata...
    this.physicalExecution.AddDerivedAst(compiledAst);
    const instructions = this.physicalExecution.GetInstructionsToAddOutput(compiledAst);
    if (instructions) await this.incrementalExecuteToDb(instructions);
    // then set up the prepared statements as well (TODO: need to think thru all the steps that need to happen for the runtime, similar to the steps that compile DIEL)
    if (derived.relationType === RelationType.Output) {
      this.setupNewOutput(derived.rName);
    }
    // also should replace things in the dependency tree if it's specified
    if (derived.replaces) {

    }
  }

  // ------------------------ debugging related ---------------------------
  inspectQueryResult(query: string): QueryResults {
    let r = this.db.exec(query)[0];
    if (r) {
      console.log(r.columns.join("\t"));
      console.log(JSON.stringify(r.values).replace(/\],\[/g, "\n").replace("[[", "").replace("]]", "").replace(/,/g, "\t"));
      // console.table(r.columns);
      // console.table(r.values);
    } else {
      console.log("No results");
    }
    return r;
  }

  /**
   * Check if the view constraint query is broken. If so, report what records broke them.
   * @param query
   * @param viewName
   * @param constraint
   */
  reportConstraintQueryResult(query: string, viewName: string, constraint: string) {
    function reportBrokenConstraints(qr: QueryResults) {
      if (qr) {
        console.log(`%cConstraint Broken!\nview: ${viewName}\nconstraint: ${constraint}`, "background:red; color: white");
        console.log(qr.columns.join("\t"));
        console.log(JSON.stringify(qr.values).replace(/\],\[/g, "\n").replace("[[", "").replace("]]", "").replace(/,/g, "\t"));
      }
    }
    // 1. test if the views are already materialized!!

    // 2. if not materialized, evaluate constraints
    this.physicalExecution.sqlAstSpecPerDb.forEach((ast, id) => {
      ast.relations.forEach((relation) => {
        // 2-1. check which db the view is defined in.
        // correct db only if the relatin is view, event view, output
        if (relation.rName === viewName && relation.relationType === SqlRelationType.View) {
              if (id === LocalDbId) {
                // local db; execute
                try {
                  reportBrokenConstraints(this.db.exec(query)[0]);
                } catch (error) {
                  LogInternalError(`Error while running view constraint query ${query}`);
                }
              } else {
                // remote db; ship the execute query
                const remoteInstance = this.findRemoteDbEngine(id);
                if (remoteInstance) {
                  const executeMessage: RemoteExecuteMessage = {
                    remoteAction: DielRemoteAction.GetResultsByPromise,
                    requestTimestep: this.timestep,
                    sql: query
                  };
                  remoteInstance.SendMsg(executeMessage, true).then((value) => {
                    if (value.results.length > 0) {
                      reportBrokenConstraints(convertRelationObjectToQueryResults(value.results));
                    }
                  });
                } else {
                  LogInternalError(`Remote ${id} is not found!`);
                }
              }
          }
      });
    });

  }
}

