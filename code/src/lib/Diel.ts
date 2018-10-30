import { Database, Statement } from "sql.js";
import { downloadHelper, RelationTs } from "./dielUtils";
import { log, timeNow } from "./dielUdfs";
import { LogInfo } from "../util/messages";

// this is an interface class that shares all of DIEL's common abstractions

type OutputBoundFunc = (v: any) => any;

type OutputConfig = {
  notNull?: boolean,
};

const defaultOuptConfig = {
  notNull: false,
};

type SetupDefinitions = {
  inputs: RelationTs[],
  outputs: RelationTs[],
  views: RelationTs[],
};

type TickBind = {view: string, s: Statement, f: OutputBoundFunc, c: OutputConfig};

export default class Diel {
  protected db: Database;
  // reactive glues
  protected output: Map<string, Statement>;
  protected input: Map<string, Statement>;
  // non reactive glues
  protected staticInput: Map<string, Statement>;
  protected staticOutput: Map<string, Statement>;
  protected boundFns: TickBind[];
  protected dbPath: string;

  /**
   * constructor
   * @param dbPath path to the generated db from the diel programs
   */
  constructor(dbPath: string) {
    LogInfo(`DIEL initializing`);
    this.runOutput = this.runOutput.bind(this);
    this.tick = this.tick.bind(this);
    this.BindOutput = this.BindOutput.bind(this);
    this.dbPath = dbPath;
    // initialize
    this.boundFns = [];
    this.input = new Map();
    this.output = new Map();
    this.staticInput = new Map();
    this.staticOutput = new Map();
  }

  public async LoadDb(file: string) {
    if (this.db) {
      this.db.close();
    }
    let buffer;
    const response = await fetch(file);
    const bufferRaw = await response.arrayBuffer();
    buffer = new Uint8Array(bufferRaw);
    this.db = new Database(buffer);
    this.db.create_function("timeNow", timeNow);
    this.db.create_function("log", log);
    this.db.create_function("tick", this.tick());
    LogInfo(`DIEL Loaded DB Successfully`);
  }

  /**
   * NewInput
   * @param i the name of the input
   * @param o the row/object of the input
   */
  public NewInput(i: string, o: any) {
    LogInfo(`NewInput for ${i}, value ${JSON.stringify(o, null, 2)}`);
    // iterate through o and add "$" to the variable assingments
    const keys = Object.keys(o);
    let newO: any = {};
    keys.map(k => {
      newO[`$${k}`] = o[k];
    });
    this.input.get(i).run(newO);
  }

  public GetStaticView(v: string, cIn = {} as OutputConfig) {
    console.log("get view", v);
    const s = this.staticOutput.get(v);
    if (!s) {
      console.log(`%c Error ${v} does not exist`, "color: red");
    }
    return this.readStmt(s, v, cIn);
  }

  public BindOutput(view: string, reactFn: OutputBoundFunc, cIn = {} as OutputConfig) {
    if (!this.output.has(view)) {
      throw new Error(`output not defined ${view} ${Array.from(this.output.keys()).join(", ")}`);
    }
    // immutable
    const c = Object.assign({}, defaultOuptConfig, cIn);
    this.boundFns.push({view, s: this.output.get(view), f: reactFn, c });
  }

  public DownloadDB() {
    let dRaw = this.db.export();
    let blob = new Blob([dRaw]);
    downloadHelper(blob,  "session");
  }

  public async Setup(relations: SetupDefinitions) {
    LogInfo(`DIEL Setting Up`);
    await this.LoadDb(this.dbPath);
    relations.inputs.map(i => this.input.set(i.name, this.db.prepare(i.query)));
    relations.outputs.map(i => this.output.set(i.name, this.db.prepare(i.query)));
    relations.views.map(i => this.staticOutput.set(i.name, this.db.prepare(i.query)));
  }

  private readStmt(s: Statement, view: string, c: OutputConfig) {
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

  private runOutput(b: TickBind) {
    let { s, f, c, view } = b;
    const r = this.readStmt(s, view, c);
    if (r) {
      f(r);
    }
    return;
  }

  private tick() {
    LogInfo("Tick called");
    const boundFns = this.boundFns;
    const runOutput = this.runOutput;
    return () => {
      // console.log("ticked!", boundFns);
      boundFns.map(b => {
        runOutput(b);
      });
    };
  }
}