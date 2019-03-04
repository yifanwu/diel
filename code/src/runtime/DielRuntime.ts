import { ANTLRInputStream, CommonTokenStream } from "antlr4ts";
import { DIELLexer } from "../parser/grammar/DIELLexer";
import { DIELParser } from "../parser/grammar/DIELParser";

import { loadPage } from "../notebook/index";
import { Database, Statement } from "sql.js";
import { SelectionUnit } from "../parser/sqlAstTypes";
import { RuntimeCell, SimpleObject, DielRuntimeConfig, TableMetaData, TableLocation, } from "./runtimeTypes";
import { OriginalRelation, DerivedRelation, DielPhysicalExecution, RelationType, } from "../parser/dielAstTypes";
import { generateSelectionUnit, generateSqlFromDielAst } from "../compiler/codegen/codeGenSql";
import Visitor from "../parser/generateAst";
import { CompileDiel, CompilePhysicalExecution } from "../compiler/DielCompiler";
import { log } from "../lib/dielUdfs";
import { downloadHelper } from "../lib/dielUtils";
import { LogInternalError, LogTmp, ReportUserRuntimeError, LogWarning, QueryConsoleColorSpec } from "../lib/messages";
import { DielIr } from "../compiler/DielIr";
import { processSqliteMasterMetaData } from "./runtimeHelper";
import WorkerPool from "./WorkerPool";
// import { generateVizSpecForSingleQuery } from "../notebook/vizSpec/generateVizSpec";

// hm watch out for import path
//  also sort of like an odd location...
const StaticSqlFile = "./src/compiler/codegen/static.sql";

export enum WorkerCmd {
  InitialSetUp = "InitialSetUp",
  ShareInputAfterTick = "ShareInputAfterTick",
  ShareViewsAfterTick = "ShareViewsAfterTick",
}

export const SqliteMasterQuery = `SELECT sql, name table_name FROM sqlite_master WHERE type='table' and sql not null`;

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
  outputConfig: OutputConfig
};

export type MetaDataPhysical = Map<string, TableMetaData>;

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
  // constraintsQueries: string[];
  workerPool: WorkerPool;
  metaData: MetaDataPhysical;
  runtimeConfig: DielRuntimeConfig;
  cells: RuntimeCell[];
  db: Database;
  visitor: Visitor;
  protected boundFns: TickBind[];
  protected output: Map<string, Statement>;

  constructor(runtimeConfig: DielRuntimeConfig) {
    // temp, fixme
    (<any>window).diel = this;
    this.runtimeConfig = runtimeConfig;
    this.cells = [];
    this.visitor = new Visitor();

    // the following are run time bindings for the reactive layer
    // this.input = new Map();
    this.output = new Map();
    this.metaData = new Map();
    this.boundFns = [];
    this.runOutput = this.runOutput.bind(this);
    this.tick = this.tick.bind(this);
    this.BindOutput = this.BindOutput.bind(this);
    this.setup();
  }

  public BindOutput(view: string, reactFn: ReactFunc, cIn = {} as OutputConfig) {
    if (!this.output.has(view)) {
      ReportUserRuntimeError(`output not defined ${view}, from current outputs of: [${Array.from(this.output.keys()).join(", ")}]`);
    }
    // immtable
    const outputConfig = Object.assign({}, defaultOuptConfig, cIn);
    this.boundFns.push({outputName: view, uiUpdateFunc: reactFn, outputConfig });
  }

  public NewInputMany(i: string, o: any[], lineage?: number) {
    this.newInputHelper(i, o, lineage);
  }

  // FIXME: gotta do some run time type checking here!
  // also fixme should use codegen and not string manipulation?
  // very inefficient, fixme
  public NewInput(i: string, o: any) {
    this.newInputHelper(i, [o]);
    // let tsI = Object.assign({$ts: timeNow()}, o);
    // TODO: check if the objects match
    // then add the dollar signs
    // const inStmt = this.input.get(i);

    // if (!inStmt) {
    //   ReportUserRuntimeError(`Input ${i} not found`);
    //   return;
    // }
    // const keys = Object.keys(o);
    // let newO: any = {};
    // keys.map(k => newO[`$${k}`] = o[k]);
    // inStmt.run(newO);
  }

  // FIXME: use AST instead of string manipulation...
  private newInputHelper(i: string, objs: any[], lineage?: number) {
    const r = this.ir.GetEventByName(i);
    let columnNames: string[] = [];
    if (r.relationType === RelationType.EventTable) {
      columnNames = (r as OriginalRelation).columns.map(c => c.name);
    } else {
      columnNames = (r as DerivedRelation)
        .selection.compositeSelections[0]
        .relation.derivedColumnSelections.map(c => c.alias);
    }
    // ${r.columns.map(c => c.name).map(v => `$${v}`).join(", ")}
    const rowQuerys = objs.map(o => {
      let values = ["max(timestep)"];
      columnNames.map(cName => {
        const raw = o[cName];
        if ((raw === null) || (raw === undefined)) {
          ReportUserRuntimeError(`We expected the input ${cName}, but it was not defined in the object.`);
        }
        if (typeof raw === "string") {
          values.push(`'${raw}'`);
        } else {
          values.push(raw);
        }
      });
      if (lineage) {
        return `select ${values.join(",")}, ${lineage} from allInputs`;
      } else {
        return `select ${values.join(",")} from allInputs`;
      }
    });
    // lazy
    let insertQuery;
    if (lineage) {
      insertQuery = `insert into ${r.name} (timestep, ${columnNames.join(", ")}, lineage)
      ${rowQuerys.join("\nUNION\n")};`;

    } else {
      insertQuery = `insert into ${r.name} (timestep, ${columnNames.join(", ")})
      ${rowQuerys.join("\nUNION\n")};`;
    }
    const finalQuery = `${insertQuery}
    insert into allInputs (inputRelation) values ('${r.name}');`;
    console.log(`%c ${finalQuery}`, QueryConsoleColorSpec);
    this.db.exec(finalQuery);

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
    const dependencies = this.ir.dependencies.inputDependenciesOutput;
    return (input: string) => {
      // note for Lucie: add constraint checking
      console.log(`%c tick ${input}`, "color: blue");
      const inputDep = dependencies.get(input);
      boundFns.map(b => {
        if (inputDep.has(b.outputName)) {
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
    this.physicalExecution = CompilePhysicalExecution(this);
    // now execute the physical views and programs
    this.executeToDBs();
    this.setupAllInputOutputs();
    loadPage();
  }

  async initialCompile() {
    this.visitor = new Visitor();
    const r = this.db.exec(SqliteMasterQuery);
    let code = processSqliteMasterMetaData(r).queries;
    let workerInfo = await this.workerPool.getMetaData();
    workerInfo.forEach((e, i) => {
      code += e.queries;
      e.names.forEach((n) => this.metaData.set(n, {
        location: TableLocation.Worker,
        accessInfo: i
      }));
    });
    console.log("got workerInfo", workerInfo);
    // TODO: for workers as well
    for (let i = 0; i < this.runtimeConfig.dielFiles.length; i ++) {
      const f = this.runtimeConfig.dielFiles[i];
      code += await (await fetch(f)).text();
    }
    // read the files in now
    const codeWithLine = code.split("\n");
    console.log(`%c DIEL Code Generated:\n${codeWithLine.map((c, i) => `${i}\t${c}`).join("\n")}`, "color: green");
    const inputStream = new ANTLRInputStream(code);
    const p = new DIELParser(new CommonTokenStream(new DIELLexer(inputStream)));
    const tree = p.queries();
    let ast = this.visitor.visitQueries(tree);
    this.ir = CompileDiel(new DielIr(ast));
  }


  async setupWorkerPool() {
    this.workerPool = new WorkerPool(this.runtimeConfig.workerDbPaths, this);
    await this.workerPool.setup();
    return;
  }

  setupUDFs() {
    this.db.create_function("log", log);
    this.db.create_function("tick", this.tick());
    this.db.create_function("shipWorkerInput", this.shipWorkerInput.bind(this));
  }

  // maybe change this to generating ASTs as opppsoed to strings?
  shipWorkerInput(inputName: string, timestep: number) {
    const shipDestination = this.physicalExecution.mainToWorker.get(inputName);
    const shareQuery = `select * from ${inputName}`;
    let tableRes = this.db.exec(shareQuery)[0];
    if ((!tableRes) || (!tableRes.values)) {
      LogWarning(`Query ${shareQuery} has NO result`);
    }
    // FIXME: have more robust typing here...
    // need to make null explicit here...
    // selection needs to have a quote around it...
    const values = tableRes.values.map((d: any[]) => `(${d.map((v: any) => (v === null) ? "null" : `'${v}'`).join(", ")})`);
    let sql = `
      DELETE from ${inputName};
      INSERT INTO ${inputName} VALUES ${values};
    `;
    const params = {lineage: timestep};
    shipDestination.forEach((v => {
      this.workerPool.SendWorkerQuery(sql, WorkerCmd.ShareInputAfterTick, v, false, params);
    }));
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

  setupAllInputOutputs() {
    // this.ir.GetInputs().map(i => this.setupNewInput(i));
    this.ir.GetAllViews().map(o => this.setupNewOutput(o));
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

  /**
   * returns the results as an array of objects (sql.js)
   */
  ExecuteAstQuery(ast: SelectionUnit): SimpleObject[] {
    const queryString = generateSelectionUnit(ast);
    return this.ExecuteStringQuery(queryString);
  }

  ExecuteStringQuery(q: string): SimpleObject[] {
    let r: SimpleObject[] = [];
    this.db.each(q, (row) => { r.push(row as SimpleObject); }, () => {});
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
    const mainSqlQUeries = generateSqlFromDielAst(this.physicalExecution.main);
    for (let s of mainSqlQUeries) {
      try {
        console.log(`%c Running Query in Main:\n${s}`, "color: purple");
        this.db.run(s);
      } catch (error) {
        LogInternalError(`Error while running\n${s}\n${error}`);
      }
    }
    // now execute to worker!
    this.physicalExecution.workers.forEach((v, k) => {
      const queries = generateSqlFromDielAst(v);
      if (queries && queries.length > 0) {
        const sql = queries.join(";\n");
        console.log(`%c Running Query in Worker[${k}]:\n${sql}`, "color: pink");
        this.workerPool.SendWorkerQuery(sql, WorkerCmd.InitialSetUp, k, false);
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