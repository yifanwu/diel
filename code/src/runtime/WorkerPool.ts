import { processSqliteMasterMetaData, WorkerMetaData } from "./runtimeHelper";
import { SqliteMasterQuery } from "./DielRuntime";

export default class WorkerPool {
  // worker related things
  resolves: any;
  rejects: any;
  globalMsgId: number;
  pool: Worker[];
  workerDbPaths: string[];

  constructor(workerDbPaths: string[]) {
    this.workerDbPaths = workerDbPaths;
    this.resolves = {};
    this.rejects = {};
    this.globalMsgId = 0;
  }

  public SendWorkerQuery(sql: string, workerLoc: number) {
    return this.SendMsg({
      action: "exec",
      sql
    }, this.pool[workerLoc]);
  }

  // FIXME: types are missing
  public SendMsg(payload: any, worker: Worker) {
    console.log("sending message", payload);
    const msgId = this.globalMsgId++;
    const msg = {
      id: msgId,
      ...payload
    };

    const self = this;
    return new Promise(function (resolve, reject) {
      // save callbacks for later
      self.resolves[msgId] = resolve;
      self.rejects[msgId] = reject;
      worker.postMessage(msg);
    });
  }

  async getMetaData() {
    console.log("getting meta data for", this.pool);
    const codes: WorkerMetaData[] = [];
    const promises = this.pool.map(w => this.SendMsg({
      // id: `getMetaData`,
      action: "exec",
      sql: SqliteMasterQuery
    }, w));
    const datas = await Promise.all(promises);
    datas.map(data => {
      codes.push(processSqliteMasterMetaData(data as any));
    });
    console.log("getting meta data");
    return codes;
  }

  async setup() {
    this.pool = [];
    if (!this.workerDbPaths) {
      this.pool.push(new Worker("./UI-dist/worker.sql.js"));
    } else {
      for (let i = 0; i < this.workerDbPaths.length; i++) {
        const file = this.workerDbPaths[i];
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
        newWorker.onmessage = this.handleMsg.bind(this);
        this.pool.push(newWorker);
      }
    }
    return;
  }

  // FIXME: look into how to get real errors
  handleMsg(msg: MessageEvent) {
    console.log("handling message", msg.data);
    const {id, err, results} = msg.data;
    if (results) {
      const resolve = this.resolves[id];
      if (resolve) {
        resolve(results);
      }
    } else {
      // error condition
      const reject = this.rejects[id];
      if (reject) {
        if (err) {
          reject(err);
        } else {
          reject("Got nothing");
        }
      }
    }
    // purge used callbacks
    delete this.resolves[id];
    delete this.rejects[id];
  }
}

