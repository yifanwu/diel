import { Database, Statement } from "sql.js";
import { downloadHelper } from "./dielUtils";
import { log, timeNow } from "./dielUdfs";
import { inputRelations, outputRelations } from "./gen/relations";

// this is an interface class that shares all of DIEL's common abstractions

type ReactFunc = (v: any) => void;
type OutputConfig = {
  notNull?: boolean,
};
const defaultOuptConfig = {
  notNull: false,
};

type TickBind = {view: string, s: Statement, f: ReactFunc, c: OutputConfig};

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

  constructor(dbPath: string) {
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
    this.setup();
  }

  public async LoadDb(file: string) {
    if (this.db) {
      this.db.close();
    }
    const response = await fetch(file);
    const bufferRaw = await response.arrayBuffer();
    const buffer = new Uint8Array(bufferRaw);
    this.db = new Database(buffer);
    this.db.create_function("log", log);
    this.db.create_function("tick", this.tick());
  }

  public NewInput(i: string, o: any) {
    let tsI = Object.assign({$ts: timeNow()}, o);
    this.input.get(i).run(tsI);
  }

  public GetStaticView(v: string, cIn = {} as OutputConfig) {
    console.log("get view", v);
    const s = this.output.get(v);
    if (!s) {
      console.log(`%c Error ${v} does not exist`, "color: red");
    }
    return this.readStmt(s, v, cIn);
  }

  public BindOutput(view: string, reactFn: ReactFunc, cIn = {} as OutputConfig) {
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

  private async setup() {
    await this.LoadDb(this.dbPath);
    inputRelations.map(i => this.input.set(i.name, this.db.prepare(i.query)));
    outputRelations.map(i => this.output.set(i.name, this.db.prepare(i.query)));
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