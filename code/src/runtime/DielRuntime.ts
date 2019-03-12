import { ANTLRInputStream, CommonTokenStream } from "antlr4ts";
import { DIELLexer } from "../parser/grammar/DIELLexer";
import { DIELParser } from "../parser/grammar/DIELParser";

import { loadPage } from "../notebook/index";
import { Database, Statement } from "sql.js";
import { RuntimeCell, DielRemoteAction, RelationObject, DielRuntimeConfig, TableMetaData, DbType, RecordObject, RemoteShipRelationMessage, RemoteUpdateRelationMessage, RemoteExecuteMessage, } from "./runtimeTypes";
import { OriginalRelation, DerivedRelation, RelationType, SelectionUnit } from "../parser/dielAstTypes";
import { generateSelectionUnit, generateSqlFromDielAst } from "../compiler/codegen/codeGenSql";
import Visitor from "../parser/generateAst";
import { CompileDiel } from "../compiler/DielCompiler";
import { log } from "../lib/dielUdfs";
import { downloadHelper } from "../lib/dielUtils";
import { LogInternalError, LogTmp, ReportUserRuntimeError, LogInternalWarning, QueryConsoleColorSpec } from "../lib/messages";
import { DielIr } from "../compiler/DielIr";
import { SqlJsGetObjectArrayFromQuery, processSqlMetaDataFromRelationObject } from "./runtimeHelper";
import { DielPhysicalExecution, DbIdType, LocalDbId, LogicalTimestep, RelationIdType } from "../compiler/DielPhysicalExecution";
import DbEngine from "./DbEngine";
import { simpleMaterializeAst } from "../compiler/passes/materialization";

const StaticSqlFile = "./src/compiler/codegen/static.sql";


export const SqliteMasterQuery = `
  SELECT sql, name FROM sqlite_master WHERE type='table' and sql not null`;

type ReactFunc = (v: any) => void;

type TickBind = {
  outputName: string,
  uiUpdateFunc: ReactFunc,
};

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
  visitor: Visitor;
  protected boundFns: TickBind[];
  protected runtimeOutputs: Map<string, Statement>;

  constructor(runtimeConfig: DielRuntimeConfig) {
    (<any>window).diel = this; // for debugging
    this.timestep = 0;
    this.runtimeConfig = runtimeConfig;
    this.eventByTimestep = new Map();
    this.cells = [];
    this.visitor = new Visitor();
    this.dbEngines = new Map();
    this.runtimeOutputs = new Map();
    this.physicalMetaData = {
      dbs: new Map(),
      relationLocation: new Map()
    };
    this.boundFns = [];
    this.runOutput = this.runOutput.bind(this);
    // this.tick = this.tick.bind(this);
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
      console.log(`Sending triggers for async static output: ${outputName}`);
      staticTriggers.map(t => {
        t.destinations.map(dbId => {
          const msg: RemoteShipRelationMessage = {
            remoteAction: DielRemoteAction.ShipRelation,
            relationName: t.relation,
            dbId
          };
          this.findRemoteDbEngine(t.dbId).SendMsg(msg);
        });
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
    // FIXME: refactor OuptConfig, not really needed
    return this.simpleGetLocal(view);
  }

  // verbose just to make sure that the exported type is kept in sync
  public NewInputMany: RelationShippingFuncType = (view: string, o: any, lineage?: number) => {
    this.newInputHelper(view, o, lineage);
  }

  public NewInput(i: string, o: any) {
    this.newInputHelper(i, [o]);
  }

  // FIXME: use AST instead of string manipulation...
  private newInputHelper(eventName: string, objs: any[], lineage?: number) {
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
      insert into ${eventName} (timestep, ${columnNames.join(", ")}) values
        ${values.map(v => `(${v.join(", ")})`)};
      insert into allInputs (timestep, inputRelation, timestamp ${lineage ? `, lineage` : ""}) values
        (${this.timestep}, '${eventName}', ${Date.now()} ${lineage ? `, ${lineage}` : ""});`;
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

  downloadDB() {
    let dRaw = this.db.export();
    let blob = new Blob([dRaw]);
    downloadHelper(blob,  "session");
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
        ReportUserRuntimeError(`${view} did not return any results.`);
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
    const materialization = simpleMaterializeAst(this.ir);
    console.log(JSON.stringify(materialization, null, 2));
    this.physicalExecution = new DielPhysicalExecution(this.ir, this.physicalMetaData, this.getEventByTimestep);
    this.updateRemotesBasedOnPhysicalExecution();
    this.executeToDBs();
    this.ir.GetAllDerivedViews().map(o => this.setupNewOutput(o));
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

  private updateRemotesBasedOnPhysicalExecution() {
    const getRelationDependencies = this.physicalExecution.getRelationDependenciesForDb;
    const getRelationsToShip = this.physicalExecution.getRelationsToShipForDb;
    this.dbEngines.forEach((db) => {
      db.setupByPhysicalExecution(getRelationDependencies, getRelationsToShip);
    });
  }

  private setupUDFs() {
    this.db.create_function("log", log);
    // this.db.create_function("tick", this.tick());
    // this.db.create_function("shipWorkerInput", this.shipWorkerInput.bind(this));
  }

  shipWorkerInput(inputName: string, timestep: number) {
    const remotesToShipTo = this.physicalExecution.getShippingInfoForDbByEvent(inputName, LocalDbId);
    const shareQuery = `select * from ${inputName}`;
    let tableRes = this.db.exec(shareQuery)[0];
    if ((!tableRes) || (!tableRes.values)) {
      LogInternalWarning(`Query ${shareQuery} has NO result`);
    }
    // FIXME: have more robust typing instead of quoting everything; look up types...
    const values = tableRes.values.map((d: any[]) => `(${d.map((v: any) => (v === null) ? "null" : `'${v}'`).join(", ")})`);
    let sql = `
      DELETE from ${inputName};
      INSERT INTO ${inputName} VALUES ${values};
    `;
    remotesToShipTo.destinationDbIds.forEach((remoteId => {
      const remote = this.findRemoteDbEngine(remoteId);
      if (remote) {
        const msg: RemoteUpdateRelationMessage = {
          remoteAction: DielRemoteAction.UpdateRelation,
          relationName: inputName,
          sql,
        };
        remote.SendMsg(msg);
      }
    }));
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
    // this.dbEngines.set(LocalDbId, this.db);
    // and run the static file that we need
    const staticQuery = await (await fetch(StaticSqlFile)).text();
    this.db.run(staticQuery);
    return;
  }
  /**
   * output tables HAVE to be local tables
   *   since they are synchronous --- if they are over other tables
   *   it would be handled via some trigger programs
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
      console.log(`%c Had error ${e} while running query ${q}`, "color: red");
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

  // TODO low pri
  // ChangeQueryVersion(qId: QueryId, ) {
  // }

  AddQuery() {
    throw new Error(`not implemnted`);
    // const cId = this.generateQId();
    // const name = this.createCellName(cId);
  }

  ChangeQuery() {
    throw new Error(`not implemnted`);
    // const q = this.getQueryById(qId);
    // q.versions.push(query);
    // q.currentVersionIdx += 1;
    // bookkeeping the views?
    // refresh the annotation
  }

  // takes in teh SqlIrs in different environments and sticks them into the databases
  // FIXME: better async handling
  // also should fix the async logic
  executeToDBs() {
    LogTmp(`Executing queries to db`);
    // const mainSqlQUeries = generateSqlFromDielAst(this.physicalExecution.getLocalDbAst());
    // debugger;
    // now execute to worker!
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
        const replace = remoteInstance.remoteType === DbType.Socket;
        const queries = generateSqlFromDielAst(ast, replace);
        if (remoteInstance) {
          if (queries && queries.length > 0) {
            const sql = queries.join(";\n");
            console.log(`%c Running Query in Remote[${id}]:\n${sql}`, "color: pink");
            const msg: RemoteExecuteMessage = {
              remoteAction: DielRemoteAction.DefineRelations,
              sql
            };
            remoteInstance.SendMsg(msg);
          }
        } else {
          LogInternalError(`Remote ${id} is not found!`);
        }
      }
    });
  }

  // used for debugging
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
}