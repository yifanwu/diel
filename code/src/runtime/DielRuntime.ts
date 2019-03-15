import { ANTLRInputStream, CommonTokenStream } from "antlr4ts";
import { DIELLexer } from "../parser/grammar/DIELLexer";
import { DIELParser, QueriesContext } from "../parser/grammar/DIELParser";

import { loadPage } from "../notebook/index";
import { Database, Statement } from "sql.js";
import { RuntimeCell, DielRemoteAction, RelationObject, DielRuntimeConfig, TableMetaData, DbType, RecordObject, RemoteShipRelationMessage, RemoteUpdateRelationMessage, RemoteExecuteMessage, } from "./runtimeTypes";
import { OriginalRelation, DerivedRelation, RelationType, SelectionUnit } from "../parser/dielAstTypes";
import { generateSelectionUnit, generateSqlFromDielAst, generateSqlViews } from "../compiler/codegen/codeGenSql";
import Visitor from "../parser/generateAst";
import { CompileDiel } from "../compiler/DielCompiler";
import { log } from "../lib/dielUdfs";
import { downloadHelper } from "../lib/dielUtils";
import { LogInternalError, LogTmp, ReportUserRuntimeError, LogInternalWarning, QueryConsoleColorSpec, ReportUserRuntimeWarning, DielInternalErrorType, ReportDielUserError, UserErrorType } from "../lib/messages";
import { DielIr } from "../compiler/DielIr";
import { SqlJsGetObjectArrayFromQuery, processSqlMetaDataFromRelationObject, ParseSqlJsWorkerResult } from "./runtimeHelper";
import { DielPhysicalExecution, DbIdType, LocalDbId, LogicalTimestep, RelationIdType } from "../compiler/DielPhysicalExecution";
import DbEngine from "./DbEngine";
import { CreateDerivedSelectionSqlAstFromDielAst } from "../compiler/codegen/createSqlIr";

import {viewConstraintCheck} from "../tests/compilerTests/generateViewConstraints";

// hm watch out for import path
//  also sort of like an odd location...
const StaticSqlFile = "./src/compiler/codegen/static.sql";
export const INIT_TIMESTEP = 1;

export const SqliteMasterQuery = `
  SELECT sql, name FROM sqlite_master WHERE type='table' and sql not null`;

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
  workerDbPaths: string[];
  physicalMetaData: PhysicalMetaData;
  runtimeConfig: DielRuntimeConfig;
  cells: RuntimeCell[];
  db: Database;
  scales: RelationObject;
  visitor: Visitor;
  constraintQueries: Map<string, ViewConstraintQuery>;
  checkConstraints: boolean;
  protected boundFns: TickBind[];
  protected runtimeOutputs: Map<string, Statement>;

  constructor(runtimeConfig: DielRuntimeConfig) {
    (<any>window).diel = this; // for debugging
    this.timestep = INIT_TIMESTEP;
    this.runtimeConfig = runtimeConfig;
    this.eventByTimestep = new Map();
    this.cells = [];
    this.visitor = new Visitor();
    this.constraintQueries = new Map();
    this.checkConstraints = true;
    this.dbEngines = new Map();
    this.runtimeOutputs = new Map();
    this.physicalMetaData = {
      dbs: new Map(),
      relationLocation: new Map()
    };
    this.boundFns = [];
    this.runOutput = this.runOutput.bind(this);
    this.tick = this.tick.bind(this);
    this.BindOutput = this.BindOutput.bind(this);
    this.setup();
  }

  getEventByTimestep(timestep: LogicalTimestep) {
    return this.eventByTimestep.get(timestep);
  }
  public BindOutput(outputName: string, reactFn: ReactFunc) {
    if (!this.runtimeOutputs.has(outputName)) {
      ReportUserRuntimeError(`output not defined ${outputName}, from current outputs of: [${Array.from(this.runtimeOutputs.keys()).join(", ")}]`);
    }
    // immtable
    // const outputConfig = Object.assign({}, defaultOuptConfig);
    this.boundFns.push({outputName: outputName, uiUpdateFunc: reactFn });
    // this is used for views that do not have inputs
    const staticTriggers = this.physicalExecution.getStaticAsyncViewTrigger(outputName);
    if (staticTriggers && staticTriggers.length > 0) {
      console.log(`Sending triggers for async static output: ${outputName}`, staticTriggers);
      if (staticTriggers) {
        staticTriggers.map(t => {
          const msg: RemoteShipRelationMessage = {
            remoteAction: DielRemoteAction.ShipRelation,
            relationName: t.relation,
            dbId: t.dbId,
            lineage: INIT_TIMESTEP
          };
          this.findRemoteDbEngine(t.dbId).SendMsg(msg);
      });
      }
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
    // FIXME: refactor OuptConfig, not really needed
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
          if ((raw === null) || (raw === undefined)) {
            ReportUserRuntimeError(`We expected the input ${cName}, but it was not defined in the object.`);
          }
          return (typeof raw === "string") ? `'${raw}'` : raw;
        });
      });
      const finalQuery = `
      insert into ${eventName} (timestep, lineage, ${columnNames.join(", ")}) values
        ${values.map(v => `(${this.timestep}, ${lineage}, ${v.join(", ")})`)};
      insert into allInputs (timestep, inputRelation, timestamp, lineage) values
        (${this.timestep}, '${eventName}', ${Date.now()}, ${lineage});`;
      console.log(`%c Tick Executing\n${finalQuery}`, QueryConsoleColorSpec);
      this.db.exec(finalQuery);
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
    }
    return;
  }

  // this should only be ran once?
  tick() {
    const boundFns = this.boundFns;
    const runOutput = this.runOutput;
    const dependencies = this.ir.dependencies.inputDependenciesOutput;
    return (input: string) => {
      // note for Lucie: add constraint checking

      console.log(`%c tick ${input}`, "color: blue");
      const inputDep = dependencies.get(input);
      boundFns.map(b => {
        if (inputDep.has(b.outputName)) {
          this.constraintChecking(b.outputName);
          runOutput(b);
        }
      });
    };
  }

  constraintChecking(viewName: string) {
    // console.log("constraint check clicked");
    console.log("toggle mode: ", this.checkConstraints);
    // only check if checking mode is turned on
    if (this.checkConstraints) {
      if (this.constraintQueries.has(viewName)) {
        var queryObject = this.constraintQueries.get(viewName);
        var queries = queryObject.queries;

        // run the entire constraint quries for that view
        queries.map(ls => {
          this.reportConstraintQueryResult(ls[0], viewName, ls[1]);
        });
      }
    }
  }

  // downloadDB() {
  //   let dRaw = this.db.export();
  //   let blob = new Blob([dRaw]);
  //   downloadHelper(blob,  "session");
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

  private async setup() {
    console.log(`Setting up DielRuntime with ${JSON.stringify(this.runtimeConfig)}`);
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
    let code = processSqlMetaDataFromRelationObject(tableDefinitions);
    // for (let i = 0; i < this.dbEngines.length; i ++) {
    const promises: Promise<{id: DbIdType, data: RecordObject[]}>[] = [];
    this.dbEngines.forEach((db) => {
      this.physicalMetaData.dbs.set(db.id, {dbType: db.remoteType});
      promises.push(db.getMetaData(db.id));
    });
    const metadatas = await Promise.all(promises);
    metadatas.map(mD => {
      code += processSqlMetaDataFromRelationObject(mD.data);
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
    code += await (await fetch(StaticSqlFile)).text();
    for (let i = 0; i < this.runtimeConfig.dielFiles.length; i ++) {
      const f = this.runtimeConfig.dielFiles[i];
      code += await (await fetch(f)).text();
    }
    const codeWithLine = code.split("\n");
    console.log(`%c DIEL Code Generated:\n${codeWithLine.map((c, i) => `${i + 1}\t${c}`).join("\n")}`, "color: green");
    const inputStream = new ANTLRInputStream(code);
    const p = new DIELParser(new CommonTokenStream(new DIELLexer(inputStream)));
    const tree = p.queries();
    let ast = this.visitor.visitQueries(tree);
    this.ir = CompileDiel(new DielIr(ast));

    // get sql for views constraints
    var tname: string;
    var viewConstraint: ViewConstraintQuery;
    viewConstraintCheck(ast).forEach((queries: string[][], viewName: string) => {
      if (queries.length > 0) {
        viewConstraint = new ViewConstraintQuery();
        viewConstraint.viewName = viewName;
        viewConstraint.queries = queries;
        this.constraintQueries.set(viewName, viewConstraint);
      }
    });
    console.log(this.constraintQueries);
    // test the IR here
  }

  async setupRemotes() {
    const inputCallback = this.NewInputMany.bind(this);
    let counter = LocalDbId;
    const workerWaiting = this.runtimeConfig.workerDbPaths
      ? this.runtimeConfig.workerDbPaths.map(path => {
        counter++;
        const remote = new DbEngine(DbType.Worker, counter, inputCallback);
        this.dbEngines.set(counter, remote);
        return remote.setup(path);
      })
      : [];
    const socketWaiting = this.runtimeConfig.socketConnections
      ? this.runtimeConfig.socketConnections.map(socket => {
        counter++;
        const remote = new DbEngine(DbType.Socket, counter, inputCallback);
        this.dbEngines.set(counter, remote);
        return remote.setup(socket.url, socket.dbName);
      })
      : [];
    await Promise.all(workerWaiting.concat(socketWaiting));
    return;
  }

  // private updateRemotesBasedOnPhysicalExecution() {
  //   this.dbEngines.forEach((db) => {
  //     const getRelationDependencies = this.physicalExecution.getRelationDependenciesForDb(db.id);
  //     const getRelationsToShip = this.physicalExecution.getRelationsToShipForDb.bind(this);
  //     const getBubbledUpRelationToShip = this.physicalExecution.getBubbledUpRelationToShip.bind(this);
  //     db.setupByPhysicalExecution(getRelationDependencies, getRelationsToShip, getBubbledUpRelationToShip);
  //   });
  // }

  private setupUDFs() {
    this.db.create_function("log", log);
    // this.db.create_function("tick", this.tick());
    // this.db.create_function("shipWorkerInput", this.shipWorkerInput.bind(this));
  }

  shipWorkerInput(inputName: string, timestep: number) {
    // const remotesToShipTo = this.physicalExecution.getShippingInfoForDbByEvent(inputName, LocalDbId);
    const remotesToShipTo = this.physicalExecution.getBubbledUpRelationToShip(LocalDbId, inputName);
    // FIXME: we can improve performance by grouping by the views to ship so that they are not evaluated multiple times.
    if (remotesToShipTo && remotesToShipTo.length > 0) {
      remotesToShipTo.map(t => {
        const shareQuery = `select * from ${t.relation}`;
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
    // if (remotesToShipTo.destinationDbIds && remotesToShipTo.destinationDbIds.length > 0) {
    //   remotesToShipTo.destinationDbIds.forEach((remoteId => {
    //     const remote = this.findRemoteDbEngine(remoteId);
    //     if (remote) {
    //       const msg: RemoteUpdateRelationMessage = {
    //         remoteAction: DielRemoteAction.UpdateRelation,
    //         relationName: inputName,
    //         lineage: timestep,
    //         sql,
    //       };
    //       remote.SendMsg(msg);
    //     }
    //   }));
    // }
  }

  private findRemoteDbEngine(remoteId: DbIdType) {
    // some increment logic...
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
    // let dielCode = "";
    if (!this.runtimeConfig.mainDbPath) {
      this.db = new Database();
    } else {
      const response = await fetch(this.runtimeConfig.mainDbPath);
      const bufferRaw = await response.arrayBuffer();
      const buffer = new Uint8Array(bufferRaw);
      this.db = new Database(buffer);
      // debug
      (<any>window).mainDb = this.db;
      // FIXME: might have some weird issues with types of DIEL tables?
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
    }
  }

  /**
   * returns the results as an array of objects (sql.js)
   */
  ExecuteAstQuery(ast: SelectionUnit): RelationObject {
    const queryString = generateSelectionUnit(ast);
    return this.ExecuteStringQuery(queryString);
  }

  ExecuteStringQuery(q: string): RelationObject {
    let r: RelationObject = [];
    this.db.each(q, (row) => { r.push(row as RecordObject); }, () => {});
    return r;
  }

  // takes in teh SqlIrs in different environments and sticks them into the databases
  // FIXME: better async handling
  // also should fix the async logic
  async executeToDBs() {
    LogTmp(`Executing queries to db`);
    // const mainSqlQUeries = generateSqlFromDielAst(this.physicalExecution.getLocalDbAst());
    // now execute to worker!
    const promises: Promise<any>[] = [];
    this.physicalExecution.astSpecPerDb.forEach((ast, id) => {
      if (id === LocalDbId) {
        const queries = generateSqlFromDielAst(ast);
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
        remoteInstance.setPhysicalExecutionReference(this.physicalExecution);
        const replace = remoteInstance.remoteType === DbType.Socket;
        const queries = generateSqlFromDielAst(ast, replace);
        if (remoteInstance) {
          if (queries && queries.length > 0) {
            const sql = queries.map(q => q + ";").join("\n");
            const msg: RemoteExecuteMessage = {
              remoteAction: DielRemoteAction.DefineRelations,
              lineage: INIT_TIMESTEP,
              sql
            };
            promises.push(remoteInstance.SendMsg(msg, true));
          }
        } else {
          LogInternalError(`Remote ${id} is not found!`);
        }
      }
    });
    await Promise.all(promises);
    return;
  }

  // ------------------------ for notebook related -----------------------------
  ChangeQuery() {
    throw new Error(`not implemnted`);
    // const q = this.getQueryById(qId);
    // q.versions.push(query);
    // q.currentVersionIdx += 1;
    // bookkeeping the views?
    // refresh the annotation
  }

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
    return result;
  }
  /**
   * AddView will take in a derived relation (the view)
   * FIXME/TODO:
   * - assume this is local (so it does not need to be processed by distributed query)
   * - also assume that it's compiled (i.e., typed & normalized etc)
   * and we can just add it to the output list
   */
  public AddView(q: DerivedRelation) {
    const queryStr = generateSqlViews(CreateDerivedSelectionSqlAstFromDielAst(q));
    this.addViewToLocal(queryStr);
    this.setupNewOutput(q);
  }

  private addViewToLocal(query: string): void {
    // exec to loca!
    this.db.run(query);
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
    let r = this.db.exec(query)[0];
    if (r) {
      console.log(`%cConstraint Broken!\nview: ${viewName}\nconstraint: ${constraint}`, "background:red; color: white");
      console.log(r.columns.join("\t"));
      console.log(JSON.stringify(r.values).replace(/\],\[/g, "\n").replace("[[", "").replace("]]", "").replace(/,/g, "\t"));
      // console.table(r.columns);
      // console.table(r.values);
      return true;
    } else {
      // console.log("No results");
      return false;
    }
  }
}