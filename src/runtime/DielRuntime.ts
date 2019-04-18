import { ANTLRInputStream, CommonTokenStream } from "antlr4ts";
import { Database, Statement } from "sql.js";

import { DIELLexer } from "../parser/grammar/DIELLexer";
import { DIELParser } from "../parser/grammar/DIELParser";

import { DielRemoteAction, RelationObject, DielConfig, TableMetaData, DbType, RecordObject, RemoteShipRelationMessage, RemoteUpdateRelationMessage, RemoteExecuteMessage, } from "./runtimeTypes";
import { OriginalRelation, DerivedRelation, RelationType, SelectionUnit, DbIdType, LogicalTimestep, RelationIdType } from "../parser/dielAstTypes";
import { generateSelectionUnit, generateSqlFromDielAst, generateSqlViews, generateInsertClauseStringForValue, generateStringFromSqlIr, generateDrop, generateCleanUpAstFromSqlAst } from "../compiler/codegen/codeGenSql";
import Visitor from "../parser/generateAst";
import { CompileDiel } from "../compiler/DielCompiler";
import { log } from "../util/dielUdfs";
import { downloadHelper, CheckObjKeys } from "../util/dielUtils";
import { LogInternalError, LogTmp, ReportUserRuntimeError, LogInternalWarning, ReportUserRuntimeWarning, ReportDielUserError, UserErrorType, PrintCode, LogInfo } from "../util/messages";
import { DielIr } from "../compiler/DielIr";
import { SqlJsGetObjectArrayFromQuery, processSqlMetaDataFromRelationObject, ParseSqlJsWorkerResult } from "./runtimeHelper";
import { DielPhysicalExecution, LocalDbId } from "../compiler/DielPhysicalExecution";
import DbEngine from "./DbEngine";
import { CreateDerivedSelectionSqlAstFromDielAst, createSqlAstFromDielAst } from "../compiler/codegen/createSqlIr";
import { checkViewConstraint } from "../compiler/passes/generateViewConstraints";
import { StaticSql } from "../compiler/codegen/staticSql";
import { getPlainSelectQueryAst } from "../compiler/compiler";
import { GetDependenciesFromViewList } from "../compiler/passes/dependency";
import { getTopologicalOrder } from "../compiler/passes/passesHelper";

// ugly global mutable pattern here...
export let STRICT = false;
export let LOGINFO = false;

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
};

export type PhysicalMetaData = {
  dbs: Map<DbIdType, DbMetaData>;
  relationLocation: Map<string, TableMetaData>;
};

export type RelationShippingFuncType = (view: string, o: RelationObject, lineage?: number) => void;

export default class DielRuntime {
  timestep: LogicalTimestep;
  eventByTimestep: Map<LogicalTimestep, RelationIdType>;
  ir: DielIr;
  physicalExecution: DielPhysicalExecution;
  dbEngines: Map<DbIdType, DbEngine>;
  physicalMetaData: PhysicalMetaData;
  config: DielConfig;
  staticRelationsSent: Set<RelationIdType>;
  db: Database;
  scales: RelationObject;
  visitor: Visitor;
  constraintQueries: Map<string, ViewConstraintQuery>;
  checkConstraints: boolean;
  protected boundFns: TickBind[];
  protected runtimeOutputs: Map<string, Statement>;

  constructor(config: DielConfig) {
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
      relationLocation: new Map()
    };
    this.staticRelationsSent = new Set();
    this.boundFns = [];
    this.runOutput = this.runOutput.bind(this);
    this.BindOutput = this.BindOutput.bind(this);
    this.setup(config.setupCb);
  }

  getEventByTimestep(timestep: LogicalTimestep) {
    return this.eventByTimestep.get(timestep);
  }

  public BindOutput(outputName: string, reactFn: ReactFunc) {
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
      console.log(`Sending triggers for async static output: ${outputName}`, staticTriggers);
        staticTriggers.map(t => {
          if (this.staticRelationsSent.has(t.relation)) {
            return; // skip
          }
          const msg: RemoteShipRelationMessage = {
            remoteAction: DielRemoteAction.ShipRelation,
            relationName: t.relation,
            dbId: t.dbId,
            lineage: INIT_TIMESTEP
          };
          this.findRemoteDbEngine(t.dbId).SendMsg(msg);
          this.staticRelationsSent.add(t.relation);
      });
    }
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
  public NewInputMany: RelationShippingFuncType = (view: string, o: any, lineage?: number) => {
    lineage = lineage ? lineage : this.timestep;
    this.newInputHelper(view, o, lineage);
  }

  public NewInput(i: string, o: any, lineage?: number) {
    lineage = lineage ? lineage : this.timestep;
    this.newInputHelper(i, [o], lineage);
  }

  // FIXME: use AST instead of string manipulation...
  private newInputHelper(eventName: string, objs: any[], lineage: number) {
    this.timestep++;
    this.eventByTimestep.set(this.timestep, eventName);
    let columnNames: string[] = [];
    const eventDefinition = this.ir.GetEventByName(eventName);
    if (eventDefinition) {
      if (eventDefinition.relationType === RelationType.EventTable) {
        columnNames = (eventDefinition as OriginalRelation).columns.map(c => c.name);
      } else {
        columnNames = (eventDefinition as DerivedRelation)
          .selection.compositeSelections[0]
          .relation.derivedColumnSelections.map(c => c.alias);
      }
      const values = objs.map(o => {
        return columnNames.map(cName => {
          const raw = o[cName];
          // it can be explicitly set to null, but not undefined
          if (raw === undefined) {
            ReportUserRuntimeError(`We expected the input ${cName}, but it was not defined in the object.`);
          }
          return generateInsertClauseStringForValue(raw);
        });
      });
      let finalQuery: string;
      const allInputQuery = `
      insert into allInputs (timestep, inputRelation, timestamp, lineage) values
        (${this.timestep}, '${eventName}', ${Date.now()}, ${lineage});`;
      if (columnNames && (columnNames.length > 0)) {
        finalQuery = `insert into ${eventName} (timestep, lineage, ${columnNames.join(", ")}) values
          ${values.map(v => `(${this.timestep}, ${lineage}, ${v.join(", ")})`)};`;
      } else {
        finalQuery = `insert into ${eventName} (timestep, lineage) values (${this.timestep}, ${lineage});`;
      }
      LogInfo(`Tick\n${finalQuery + allInputQuery}`);
      this.db.exec(finalQuery + allInputQuery);

      const inputDep = this.ir.dependencies.inputDependenciesOutput.get(eventName);
      this.boundFns.map(b => {
        if (inputDep.has(b.outputName)) {
          this.runOutput(b);
        }
      });
      this.shipWorkerInput(eventName, this.timestep);
    } else {
      ReportUserRuntimeError(`Event ${eventName} is not defined`);
    }
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

  // tick() {
  //   const boundFns = this.boundFns;
  //   const runOutput = this.runOutput;
  //   const dependencies = this.ir.dependencies.inputDependenciesOutput;
  //   const shipWorkerInput = this.shipWorkerInput;
  //   return (input: string, step: LogicalTimestep) => {
  //     // note for Lucie: add constraint checking
  //     console.log(`%c tick ${input}`, "color: blue");
  //   };
  // }

  /**
   * Check view constraints afresh and report if broken
   */
  constraintChecking(viewName: string) {
    // TODO. Check view constraint for nested views. currently, it only checks output view.
    console.log("toggle mode: ", this.checkConstraints);
    console.log("constraint query: ", this.constraintQueries);

    // only check if checking mode is turned on
    if (this.checkConstraints) {
      // 1. evaluate view constraints that are not outputs
      // 1-1. get views that this output depends on in topological order
      let rel = this.ir.GetRelationDef(viewName) as DerivedRelation;
      const deps = GetDependenciesFromViewList([rel]);
      const topoOrder = getTopologicalOrder(deps);
      console.log(topoOrder);

      // 1-2. evaluate their constraints by topo order
      // if already materialized, no need to evaluate
      for (let relation of topoOrder) {
        if (this.constraintQueries.has(relation)) {
          console.log(relation);
          let queryObject = this.constraintQueries.get(relation);
          let queries = queryObject.queries;
          // run the entire constraint quries for that view
          queries.map(ls => {
            this.reportConstraintQueryResult(ls[0], relation, ls[1]);
          });
        }
      }
    }
  }

  downloadDB(dbId?: DbIdType) {
    if ((!dbId) || (dbId === LocalDbId)) {
      let dRaw = this.db.export();
      let blob = new Blob([dRaw]);
      downloadHelper(blob,  "session");
    } else {
      const remote = this.dbEngines.get(dbId);
      if (remote) {
        remote.downloadDb();
      }
    }
  }

  simpleGetLocal(view: string): RelationObject {
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
        ReportUserRuntimeWarning(`${view} did not return any results.`);
      }
    } else {
      ReportUserRuntimeError(`${view} does not exist.`);
    }
    return null;
  }

  private async setup(loadPage: () => void) {
    console.log(`Setting up DielRuntime with ${JSON.stringify(this.config)}`);
    await this.setupMainDb();
    await this.setupRemotes();
    await this.initialCompile();
    this.setupUDFs();
    this.physicalExecution = new DielPhysicalExecution(this.ir, this.physicalMetaData, this.getEventByTimestep.bind(this));
    await this.executeToDBs();
    this.ir.GetOutputs().map(o => this.setupNewOutput(o));
    this.scales = ParseSqlJsWorkerResult(this.db.exec("select * from __scales"));
    loadPage();
  }

  async initialCompile() {
    this.visitor = new Visitor();
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
    this.physicalMetaData.dbs.set(LocalDbId, {dbType: DbType.Local});
    let code = processSqlMetaDataFromRelationObject(tableDefinitions, "main");
    const promises: Promise<{id: DbIdType, data: RecordObject[]}>[] = [];
    this.dbEngines.forEach((db) => {
      this.physicalMetaData.dbs.set(db.id, {dbType: db.config.dbType});
      promises.push(db.getMetaData(db.id));
    });
    const metadatas = await Promise.all(promises);
    // const allDielRelations = this.ir.GetAllRelationNames();
    metadatas.map(mD => {
      code += processSqlMetaDataFromRelationObject(mD.data, mD.id.toString());
      // .map(m => m["sql"] + ";").join("\n");
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
    this.ir = CompileDiel(new DielIr(ast));

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

  private setupUDFs() {
    this.db.create_function("log", log);
  }

  /**
   * Note for RYAN
   * caching logic here
   * - get all cacheable outputs dependent on this input
   * - for each cacheable output
   *   - check if its depenent state is the same
   *   - only ship to the remotes that need to do a reevaluation
   *   - for the outputs that are cached, do newInput to the events, with the cached dataId
   * @param inputName
   * @param timestep
   */
  shipWorkerInput(inputName: string, timestep: number) {
    // const remotesToShipTo = this.physicalExecution.getShippingInfoForDbByEvent(inputName, LocalDbId);
    const remotesToShipTo = this.physicalExecution.getBubbledUpRelationToShip(LocalDbId, inputName);
    // FIXME: we can improve performance by grouping by the views to ship so that they are not evaluated multiple times.
    if (remotesToShipTo && remotesToShipTo.length > 0) {
      remotesToShipTo.map(t => {
        // select * is problematic for event relations since the corresponding one does not have the additional timestep
        // get the columsn...
        // const rDef = this.ir.GetRelationDef(t.relation) as OriginalRelation;
        // if (!rDef.columns) {
        //   LogInternalError(`Columns for ${t.relation} not defined, it looks like ${JSON.stringify(rDef, null, 2)}`);
        // }
        const columns = this.ir.GetColumnsFromRelationName(t.relation);
        const shareQuery = `select ${columns.map(c => c.columnName).join(", ")} from ${t.relation}`;
        let tableRes = this.db.exec(shareQuery)[0];
        if ((!tableRes) || (!tableRes.values)) {
          LogInternalWarning(`Query ${shareQuery} has NO result`);
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
          lineage: timestep,
          sql
        };
        this.dbEngines.get(t.destination).SendMsg(updateMsg);
      });
    }
  }

  private findRemoteDbEngine(remoteId: DbIdType) {
    const r = this.dbEngines.get(remoteId);
    if (!r) {
      LogInternalError(`Remote ${remoteId} not found`);
    }
    return r;
  }

  /**
   * returns the DIEL code that will be ran to register the tables
   */
  private async setupMainDb() {
    if (!this.config.mainDbPath) {
      this.db = new Database();
    } else {
      const response = await fetch(this.config.mainDbPath);
      const bufferRaw = await response.arrayBuffer();
      const buffer = new Uint8Array(bufferRaw);
      this.db = new Database(buffer);
    }
    return;
  }
  /**
   * output tables HAVE to be local tables
   *   since they are synchronous --- if they are over other tables
   *   it would be handled via some trigger programs
   * FIXME: just pass in what it needs, the name str
   */
  private setupNewOutput(r: DerivedRelation) {
    const q = `select * from ${r.name}`;
    this.runtimeOutputs.set(
      r.name,
      this.dbPrepare(q)
    );
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
    const queryString = generateSelectionUnit(ast);
    return this.ExecuteStringQuery(queryString);
  }

  ExecuteStringQuery(q: string): RelationObject {
    let r: RelationObject = [];
    this.db.each(q, (row) => { r.push(row as RecordObject); }, () => {});
    return r;
  }

  // takes in the SqlIrs in different environments and sticks them into the databases
  // FIXME: better async handling
  async executeToDBs() {
    LogTmp(`Executing queries to db`);
    // now execute to worker!
    const promises: Promise<any>[] = [];
    this.physicalExecution.astSpecPerDb.forEach((ast, id) => {
      if (id === LocalDbId) {
        const queries = generateStringFromSqlIr(createSqlAstFromDielAst(ast, false), false);
        for (let s of queries) {
          try {
            console.log(`%c Running Query in Main:\n${s}`, "color: purple");
            this.db.run(s);
          } catch (error) {
            LogInternalError(`Error while running\n${s}\n${error}`);
          }
        }
      } else {
        const remoteInstance = this.findRemoteDbEngine(id);
        if (remoteInstance) {
          remoteInstance.setPhysicalExecutionReference(this.physicalExecution);
          const replace = remoteInstance.config.dbType === DbType.Socket;
          const isRemote = true;
          const sqlAst = createSqlAstFromDielAst(ast, isRemote);
          const queries = generateStringFromSqlIr(sqlAst, replace);
          if (queries && queries.length > 0) {
            const sql = queries.map(q => q + ";").join("\n");
            const msg: RemoteExecuteMessage = {
              remoteAction: DielRemoteAction.DefineRelations,
              lineage: INIT_TIMESTEP,
              sql,
            };
            promises.push(remoteInstance.SendMsg(msg, true));
          }
          const deleteQueryAst = generateCleanUpAstFromSqlAst(sqlAst);
          const deleteQueries = deleteQueryAst.map(d => generateDrop(d)).join("\n");
          console.log(`%c Cleanup queries:\n${deleteQueries}`, "color: blue");
          if ((remoteInstance.config.dbType === DbType.Socket) && deleteQueries) {
            const msg: RemoteExecuteMessage = {
              remoteAction: DielRemoteAction.CleanUpQueries,
              lineage: INIT_TIMESTEP,
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
   * if there is no name, it's a view
   * if there is name, it's a select
   * need to specify what kind of relation: is it an output? FIXME later, maybe we don't need this commitment up front?
   */
  public AddRelationByString(q: string, rType: RelationType, rName?: string) {
    const selectionUnitAst = getPlainSelectQueryAst(q);
    // then we need to give it a name
    // then we need to do the normalization, infertypes
    // FIXME: add a way to add templates?

    // then we need to decide how it will be executed
    // see if the data is over local, if so, do nothing

    // if data is over remote, then split into async event - TODO? Ryan/Lucie?

  }

  public async AddViewByAst(q: DerivedRelation) {
    const queryStr = generateSqlViews(CreateDerivedSelectionSqlAstFromDielAst(q));
    this.addViewToLocal(queryStr);
    this.setupNewOutput(q);
  }

  private addViewToLocal(query: string): void {

  }

  // ------------------------ debugging related ---------------------------
  inspectQueryResult(query: string) {
    let r = this.db.exec(query)[0];
    if (r) {
      console.log(r.columns.join("\t"));
      console.log(JSON.stringify(r.values).replace(/\],\[/g, "\n").replace("[[", "").replace("]]", "").replace(/,/g, "\t"));
      // console.table(r.columns);
      // console.table(r.values);
    } else {
      console.log("No results");
    }
  }
  // used for debugging
  reportConstraintQueryResult(query: string, viewName: string, constraint: string): boolean {
    // 1. test if the views are already materialized!!

    // 2. if not materialized, evaluate constraints
    // 2-1. resolve distributed views
    console.log(`%cConstraint Broken!\nview: ${viewName}\nconstraint: ${constraint}`, "background:red; color: white");
    return true;

  //   let dbID = this.physicalMetaData.relationLocation.get(viewName).dbId;
  //   let r;
  //   if (dbID === LocalDbId) {
  //     r = this.db.exec(query)[0];
  //   } else {
  //     const executeMessage: RemoteExecuteMessage = {
  //       remoteAction: DielRemoteAction.GetResultsByPromise,
  //       lineage: this.timestep,
  //       sql: query
  //     };
  //     this.dbEngines.get(dbID).SendMsg(executeMessage).then((value) => {
  //       r = value;
  //     });
  //   }
  //   if (r) {
  //     console.log(`%cConstraint Broken!\nview: ${viewName}\nconstraint: ${constraint}`, "background:red; color: white");
  //     console.log(r.columns.join("\t"));
  //     console.log(JSON.stringify(r.values).replace(/\],\[/g, "\n").replace("[[", "").replace("]]", "").replace(/,/g, "\t"));
  //     // console.table(r.columns);
  //     // console.table(r.values);
  //     return true;
  //   } else {
  //     // console.log("No results");
  //     return false;
  //   }
  }
}