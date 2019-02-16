
// this is really weird, somehow passing it in causes asynchrony issues... #HACK, #FIXME
import { loadPage } from "../notebook/index";
import { Database, Statement } from "sql.js";
import { SelectionUnit } from "../parser/sqlAstTypes";
import { RuntimeCell, DbRow, DielRuntimeConfig, TableMetaData, } from "./runtimeTypes";
import { OriginalRelation, DerivedRelation, DielPhysicalExecution, } from "../parser/dielAstTypes";
import { generateSelectionUnit, generateSqlFromIr } from "../compiler/codegen/codeGenSql";
import Visitor from "../parser/generateAst";
import { getDielIr } from "../lib/cli-compiler";
import DielCompiler from "../compiler/DielCompiler";
import { timeNow } from "../lib/dielUdfs";
import { downloadHelper } from "../lib/dielUtils";
import { SqlIr, createSqlIr } from "../compiler/codegen/createSqlIr";
import { LogInternalError } from "../lib/messages";

// hm watch out for import path
//  also sort of like an odd location...
const StaticSqlFile = "./compiler/codegen/static.sql";

type ReactFunc = (v: any) => void;
type OutputConfig = {
  notNull?: boolean,
};
const defaultOuptConfig = {
  notNull: false,
};

type TickBind = {
  outputName: string,
  uiUpdateFunc: ReactFunc,
  outputConfig: OutputConfig};

/**
 * DielIr would now take an empty ast
 * - we would then progressively add queries, also contains the setup logic with the db here
 * - there would be no sql and ts generation here as a result
 * - also use the DielIr internal functions to add the new queries
 *
 * FIXME: fix the DIEL congfig logic
 */
export default class DielRuntime {
  compiler: DielCompiler;
  physicalExecution: DielPhysicalExecution;
  metaData: Map<string, TableMetaData>;
  runtimeConfig: DielRuntimeConfig;
  cells: RuntimeCell[];
  db: Database;
  workerDbPool: Worker[];
  visitor: Visitor;
  protected boundFns: TickBind[];
  protected output: Map<string, Statement>;
  protected input: Map<string, Statement>;

  constructor(runtimeConfig: DielRuntimeConfig) {
    this.runtimeConfig = runtimeConfig;
    this.cells = [];
    this.visitor = new Visitor();

    // the following are run time bindings for the reactive layer
    this.input = new Map();
    this.output = new Map();
    this.runOutput = this.runOutput.bind(this);
    this.tick = this.tick.bind(this);
    this.BindOutput = this.BindOutput.bind(this);
    this.setup();
  }

  public BindOutput(view: string, reactFn: ReactFunc, cIn = {} as OutputConfig) {
    if (!this.output.has(view)) {
      throw new Error(`output not defined ${view} ${Array.from(this.output.keys()).join(", ")}`);
    }
    // immtable
    const outputConfig = Object.assign({}, defaultOuptConfig, cIn);
    this.boundFns.push({outputName: view, uiUpdateFunc: reactFn, outputConfig });
  }

  // FIXME: gotta do some run time type checking here!
  public NewInput(i: string, o: any) {
    let tsI = Object.assign({$ts: timeNow()}, o);
    this.input.get(i).run(tsI);
  }

  /**
   * this is the execution logic
   *   where we do distributed query execution
   *   and possibly materialization (basically can be in SQL triggers or our own even handling layer)
   */
  runOutput(b: TickBind) {
    const r = this.simpleGetLocal(b.outputName, b.outputConfig);
    if (r) {
      b.uiUpdateFunc(r);
    }
    return;
  }

  // this should only be ran once?
  tick() {
    const boundFns = this.boundFns;
    const runOutput = this.runOutput;
    const dependencies = this.compiler.GenerateDependenciesByInput();
    return (input: string) => {
      const inputDep = dependencies.get(input);
      boundFns.map(b => {
        if (inputDep.findIndex(iD => iD === b.outputName) > -1) {
          runOutput(b);
        }
      });
    };
  }

  downloadDB() {
    let dRaw = this.db.export();
    let blob = new Blob([dRaw]);
    downloadHelper(blob,  "session");
  }

  simpleGetLocal(view: string, c: OutputConfig) {
    const s = this.output.get(view);
    s.bind({});
    let r = [];
    while (s.step()) {
      r.push(s.getAsObject());
    }
    if (c.notNull && r.length === 0) {
      throw new Error(`${view} should not be null`);
    }
    if (r.length > 0) {
      return r;
    }
    console.log(`%cError ${view} did not return a value`, "color: red");
    return null;
  }


  /**
   * sets up both the maindb and the worker
   * TODO: a local SQLite/Postgres instance
   */
  private async setup() {
    console.log(`Setting up DielRuntime with ${JSON.stringify(this.runtimeConfig)}`);
    await this.setupMainDb();
    await this.setupWorkerPool();
    // below are logic for the physical execution of the programs
    // we first do the distribution
    this.basicDistributedQueries();
    // then materialization
    this.materializeQueries();
    // then caching
    this.cacheQueries();
    // now execute the physical views and programs
    this.executeToDBs();
    this.setupAllInputOutputs();
    loadPage();
  }

  private async setupMainDb() {
    if (!this.runtimeConfig.mainDbPath) {
      this.db = new Database();
    } else {
      const response = await fetch(this.runtimeConfig.mainDbPath);
      const bufferRaw = await response.arrayBuffer();
      const buffer = new Uint8Array(bufferRaw);
      this.db = new Database(buffer);
      // TODO we need to integrate the dbs in the existing db
      // SELECT name,sql FROM sqlite_master WHERE type='table';
      // then parse the definitions into the existing ast...
    }
    // and run the static file that we need
    const staticQuery = await (await fetch(StaticSqlFile)).text();
    this.db.run(staticQuery);
    return;
  }

  async setupWorkerPool() {
    this.workerDbPool = [];
    if (!this.runtimeConfig.workerDbPaths) {
      this.workerDbPool.push(new Worker("./UI-dist/worker.sql.js"));
    } else {
      for (let i = 0; i < this.runtimeConfig.workerDbPaths.length; i++) {
        const file = this.runtimeConfig.workerDbPaths[i];
        const newWorker = new Worker("./UI-dist/worker.sql.js");
        // also load the data in
        const response = await fetch(file);
        const bufferRaw = await response.arrayBuffer();
        const buffer = new Uint8Array(bufferRaw);
        newWorker.postMessage({
          id: "opened",
          action: "open",
          buffer,
        });
        // TODO:
        // find out what the relations are and put in metaData
        this.workerDbPool.push(newWorker);
      }
    }
    return;
  }

  setupAllInputOutputs() {
    this.compiler.ast.inputs.map(i => this.setupNewInput(i));
    this.compiler.ast.outputs.map(o => this.setupNewOutput(o));
  }

  /**
   * output tables HAVE to be local tables
   *   since they are synchronous --- if they are over other tables
   *   it would be handled via some trigger programs
   */
  private setupNewOutput(r: DerivedRelation) {
    const insertQuery = `select * from ${r.name}`;
    this.output.set(
      r.name,
      this.db.prepare(insertQuery)
    );
  }

  // FIXME: in the future we should create ASTs and generate it, as opposed to raw strings
  //   raw strings are faster, hack for now...
  private setupNewInput(r: OriginalRelation) {
    const insertQuery = `
      insert into ${r.name} (timestep, timestamp, ${r.columns.map(c => c.name).join(", ")})
      select
        max(timestep),
        timeNow(),
        ${r.columns.map(c => c.name).map(v => `$${v}`).join(", ")}
      from allInputs;`;
    this.input.set(
      r.name,
      this.db.prepare(insertQuery)
    );
  }

  // TODO!
  async setupRemotes() {

  }

  async setupDielCode() {
    // this means that things will be set later...
    if (!this.runtimeConfig.dielFiles) return;
    let dielCode = "";
    for (let i = 0; i < this.runtimeConfig.dielFiles.length; i++) {
      const file = this.runtimeConfig.workerDbPaths[i];
      const response = await fetch(file);
      const textRaw = await response.text();
      dielCode += textRaw;
    }
    // FIXME: some config logic here...
    getDielIr(dielCode);
  }

  /**
   * returns the results as an array of objects (sql.js)
   */
  ExecuteAstQuery(ast: SelectionUnit): DbRow[] {
    // const columnTypes = DielIr.GetSimpleColumnsFromSelectionUnit(ast);
    const queryString = generateSelectionUnit(ast);
    return this.ExecuteStringQuery(queryString);
  }

  ExecuteStringQuery(q: string): DbRow[] {
    let r: DbRow[] = [];
    this.db.each(q, (row) => { r.push(row as DbRow); }, () => {});
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


  /**
   * assume that this will be the first one executed!
   * FIXME:
   * - deal with remotes
   * - create async events
   * this already lowers the IR to the SQLIr
   */
  basicDistributedQueries() {
    // first walk through the outputs that make use of worker based tables
    // then add to the input program to ship the relevant inputs over to the worker tables
    // then query in worker tables
    // then send the results back into main
    // function newSqlIr(): SqlIr {
    //   return {
    //     views: [],
    //     programs: [],
    //   };
    // }
    const workers = new Map<string, SqlIr>();
    const remotes = new Map<string, SqlIr>();
    // for now just stick them all in there...
    // FIXME: not working!
    const main = createSqlIr(this.compiler.ast);
    // now put all the views that contain worker tables out into the respective workers
    // just walk through the depTree and look up their names in the metaData part
    this.physicalExecution = {
      main,
      workers,
      remotes,
    };
  }

  materializeQueries() {
    // TODO
    return;
  }

  cacheQueries() {
    // TODO
    return;
  }

  // takes in teh SqlIrs in different environments and sticks them into the databases
  // FIXME: better async handling
  // also should fix the async logic
  executeToDBs() {
    const mainSqlQUeries = generateSqlFromIr(this.physicalExecution.main);
    for (let s of mainSqlQUeries) {
      try {
        this.db.run(s);
      } catch (error) {
        LogInternalError(`Error while running\n${s}\n${error}`);
      }
    }
  }
}