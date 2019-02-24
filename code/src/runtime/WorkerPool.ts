import { processSqliteMasterMetaData, WorkerMetaData } from "./runtimeHelper";
import DielRuntime, { SqliteMasterQuery, WorkerCmd } from "./DielRuntime";
import { ReportDielUserError, LogInternalError } from "../lib/messages";
import { QueryResults } from "sql.js";

enum WorkerMessageType {
  Promise = "Promise",
  Default = "Default"
}

function parseWorkerId(id: string) {
  const tokens = id.split("-");
  const messageType = tokens[0];
  let isPromise = false;
  let promiseId = -1;
  let customId: string;
  let infoObj: any;
  if (messageType === WorkerMessageType.Promise) {
    isPromise = true;
    promiseId = parseInt(tokens[1]);
    customId = tokens[2];
  } else {
    customId = tokens[1];
    if (tokens.length > 2) {
      infoObj = JSON.parse(tokens[2]);
    }
  }
  return {
    isPromise,
    promiseId,
    customId,
    infoObj
  };
}

// FIXME: refactor and think about the asynchrony structure for workers and whether we need to do the promise everytime.
export default class WorkerPool {
  // worker related things
  rt: DielRuntime;
  resolves: any;
  rejects: any;
  globalMsgId: number;
  pool: Worker[];
  workerDbPaths: string[];

  // this is a really sketch pattern, we need rt later
  // essentially relying on global variable : /
  // FIXME: discuss with soemone what a better design pattern would be
  constructor(workerDbPaths: string[], rt: DielRuntime) {
    this.workerDbPaths = workerDbPaths;
    this.rt = rt;
    this.resolves = {};
    this.rejects = {};
    this.globalMsgId = 0;
  }

  public SendWorkerQuery(sql: string, customId: string, workerLoc: number, isPromise = false) {
    return this.SendMsg({
      action: "exec",
      sql
    }, customId, this.pool[workerLoc], isPromise);
  }

  // FIXME: types are missing
  public SendMsg(payload: any, customId: string, worker: Worker, isPromise = false) {
    console.log("sending message", payload);
    // if (customId.indexOf("-") > -1) {
    //   LogInternalError(`ID cannot contain protected character "-", but you used ${customId}`);
    // }
    if (isPromise) {
      const msgId = this.globalMsgId++;
      const msg = {
        id: `${WorkerMessageType.Promise}-${msgId}-${customId}`,
        ...payload
      };
      const self = this;
      return new Promise(function (resolve, reject) {
        // save callbacks for later
        self.resolves[msgId] = resolve;
        self.rejects[msgId] = reject;
        worker.postMessage(msg);
      });
    } else {
      worker.postMessage({
        id: `${WorkerMessageType.Default}-${customId}`,
        ...payload
      });
      return null;
    }
  }

  async getMetaData() {
    console.log("getting meta data for", this.pool);
    const codes: WorkerMetaData[] = [];
    const promises = this.pool.map(w => this.SendMsg({
      action: "exec",
      sql: SqliteMasterQuery
    }, `getMetaData`, w, true));
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
        newWorker.onmessage = (msg: MessageEvent) => {
          const {id} = msg.data;
          if (id === "opened") {
            newWorker.onmessage = this.getHandleMsgForWorker(i);
          }
        };
        this.pool.push(newWorker);
      }
    }
    return;
  }

  // each worker's handling is a little different
  getHandleMsgForWorker(wLoc: number) {
    const self = this;
    // FIXME: look into how to get real errors
    const handleMsg = (msg: MessageEvent) => {
      console.log("handling message", msg.data);
      const {id, err} = msg.data;
      const results = msg.data.results as QueryResults[];
      const args = parseWorkerId(id);
      if (args.isPromise) {
        const promiseId = args.promiseId;
        if (results) {
          const resolve = self.resolves[promiseId];
          if (resolve) {
            resolve(results);
          }
        } else {
          // error condition
          const reject = self.rejects[promiseId];
          if (reject) {
            if (err) {
              reject(err);
            } else {
              reject("Got nothing");
            }
          }
        }
        // purge used callbacks
        delete self.resolves[promiseId];
        delete self.rejects[promiseId];
      } else {
        const customId = args.customId;
        // TODO: other logic
        if (customId === WorkerCmd.ShareInputAfterTick) {
          // share the views: exec select * from the view
          // then insert into the table in main
          // the trigger is actually coordianted through allInput table,
          // which is event based, as opposed to input row based.
          // we need to look at what we need to ship over
          const viewsToShare = this.rt.physicalExecution.workerToMain.get(wLoc);
          for (let item of viewsToShare) {
            const sql = `select * from ${item}`;
            const customId = `${WorkerCmd.ShareViewsAfterTick}-${JSON.stringify({view: item})}`;
            self.SendWorkerQuery(sql, customId, wLoc);
          }
        } else if (customId === WorkerCmd.ShareViewsAfterTick) {
          const view = args.infoObj.view;
          if (!view) {
            LogInternalError(`View should be defined for sharing views!`);
          }
          if (results[0] && results[0].values.length > 0) {
            const columns = results[0].columns.join(", ");
            const valueStr = results[0].values.map((v: any) => `(${v.map((vi: any) => {
              if (typeof vi === "string") {
                return `'${vi}'`;
              }
              return vi;
            }).join(",")})`);
            // FIXME maybe sahana? add look up to existing IR to figure out what is a string
            // and add quotes.
            const sql = `INSERT INTO ${view} (${columns}) VALUES ${valueStr};`;
            this.rt.db.exec(sql);
          }
        } else {
          console.log(`%c Got ${args.customId} and not handled`, "color: gray");
        }
      }
    };
    return handleMsg;
  }

}

