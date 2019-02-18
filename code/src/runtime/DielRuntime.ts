import { ANTLRInputStream, CommonTokenStream } from "antlr4ts";
import { DIELLexer } from "../parser/grammar/DIELLexer";
import { DIELParser } from "../parser/grammar/DIELParser";

// this is really weird, somehow passing it in causes asynchrony issues... #HACK, #FIXME
import { loadPage } from "../notebook/index";
import { Database, Statement } from "sql.js";
import { SelectionUnit } from "../parser/sqlAstTypes";
import { RuntimeCell, DbRow, DielRuntimeConfig, TableMetaData, } from "./runtimeTypes";
import { OriginalRelation, DerivedRelation, DielPhysicalExecution, } from "../parser/dielAstTypes";
import { generateSelectionUnit, generateSqlFromIr } from "../compiler/codegen/codeGenSql";
import Visitor from "../parser/generateAst";
// import { getDielIr } from "../lib/cli-compiler";
import { CompileDiel } from "../compiler/DielCompiler";
import { log } from "../lib/dielUdfs";
import { downloadHelper } from "../lib/dielUtils";
import { SqlIr, createSqlIr } from "../compiler/codegen/createSqlIr";
import { LogInternalError, LogTmp } from "../lib/messages";
import { DielIr } from "../compiler/DielIr";

// hm watch out for import path
//  also sort of like an odd location...
const StaticSqlFile = "./src/compiler/codegen/static.sql";

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
  ir: DielIr;
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
    // temp, fixme
    (<any>window).diel = this;
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
    // let tsI = Object.assign({$ts: timeNow()}, o);
    this.input.get(i).run(o);
  }

  // this should be read only
  // FIXME: not sure how to enforce..
  public IterateOverOriginalRelations(f: (r: OriginalRelation) => any) {
    return this.ir.ast.originalRelations.map(f);
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
    const dependencies = this.ir.dependencies.inputDependencies;
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
    await this.initialCompile();
    this.setupUDFs();
    // now parse DIEL
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

  async initialCompile() {
    this.visitor = new Visitor();
    let code = "";
    const r = this.db.exec(`SELECT sql FROM sqlite_master WHERE type='table' and sql not null`);
    if (r.length > 0) {
      code = r[0].values.map(row => {
        const queryWithReigster = (row[0] as string).replace(/create table/ig, "register table");
        // THIS IS HACKY AF
        // basically going to regex the create table to register table
        return `${queryWithReigster};\n`;
      }).join("");
    }
    // TODO: for workers as well
    for (let i = 0; i < this.runtimeConfig.dielFiles.length; i ++) {
      const f = this.runtimeConfig.dielFiles[i];
      code += await (await fetch(f)).text();
    }
    LogTmp(`Generated code looks like this: ${code}`);
    // read the files in now
    const inputStream = new ANTLRInputStream(code);
    const p = new DIELParser(new CommonTokenStream(new DIELLexer(inputStream)));
    const tree = p.queries();
    let ast = this.visitor.visitQueries(tree);
    this.ir = CompileDiel(new DielIr(ast));
  }

  setupUDFs() {
    this.db.create_function("log", log);
    this.db.create_function("tick", this.tick());
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
    this.ir.GetInputs().map(i => this.setupNewInput(i));
    this.ir.GetOutputs().map(o => this.setupNewOutput(o));
  }
  /**
   * output tables HAVE to be local tables
   *   since they are synchronous --- if they are over other tables
   *   it would be handled via some trigger programs
   */
  private setupNewOutput(r: DerivedRelation) {
    const q = `select * from ${r.name}`;
    this.output.set(
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

  // FIXME: in the future we should create ASTs and generate it, as opposed to raw strings
  //   raw strings are faster, hack for now...
  private setupNewInput(r: OriginalRelation) {
    const insertQuery = `
      insert into ${r.name} (timestep, ${r.columns.map(c => c.name).join(", ")})
      select
        max(timestep),
        ${r.columns.map(c => c.name).map(v => `$${v}`).join(", ")}
      from allInputs;`;
    this.input.set(
      r.name,
      this.dbPrepare(insertQuery)
    );
  }

  // TODO!
  async setupRemotes() {

  }


  /**
   * returns the results as an array of objects (sql.js)
   */
  ExecuteAstQuery(ast: SelectionUnit): DbRow[] {
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
    const main = createSqlIr(this.ir.ast);
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
    LogTmp(`Executing queries to db`);
    const mainSqlQUeries = generateSqlFromIr(this.physicalExecution.main);
    for (let s of mainSqlQUeries) {
      try {
        LogTmp(s);
        this.db.run(s);
      } catch (error) {
        LogInternalError(`Error while running\n${s}\n${error}`);
      }
    }
  }
}