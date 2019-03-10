import { DbType, RelationObject, DielRemoteAction, DielRemoteMessage, DielRemoteReply, DielRemoteMessageId } from "./runtimeTypes";
import { SqliteMasterQuery, NewInputManyFuncType } from "./DielRuntime";
import { LogInternalError, ReportDielUserError } from "../lib/messages";
import { DbIdType } from "../compiler/DielPhysicalExecution";
import { parseSqlJsWorkerResult } from "./runtimeHelper";
// import { WorkerMetaData, processSqliteMasterMetaData } from "./runtimeHelper";

async function connectToSocket(url: string): Promise<WebSocket> {
  return new Promise<WebSocket>(function(resolve, reject) {
    let socket = new WebSocket(url);
    socket.onopen = function() {
      console.log("resolved socket");
      resolve(socket);
    };
    socket.onerror = function(err) {
      console.log("socket error");
      reject(err);
    };
  });
}


// TODO: do some unit tests...
function parseDielReply(rawStr: string): DielRemoteReply {
  let msg = JSON.parse(rawStr);
  msg.id = JSON.parse(msg.id);
  return msg;
}

const WebWorkerSqlPath = "./UI-dist/worker.sql.js";

const DielRemoteActionToEngineActionWorker = new Map<DielRemoteAction, string>([
  [DielRemoteAction.GetViewsToShare, "exec"],
  [DielRemoteAction.GetResultsByPromise, "exec"],
  [DielRemoteAction.ConnectToDb, "open"],
  [DielRemoteAction.DefineRelations, "exec"],
  [DielRemoteAction.ShareInputAfterTick, "exec"]
]);
const DielRemoteActionToEngineActionSocket = new Map(DielRemoteActionToEngineActionWorker);
DielRemoteActionToEngineActionSocket.set(DielRemoteAction.DefineRelations, "run");

// to unify worker and websocket
class ConnectionWrapper {

  remoteType: DbType;
  connection: Worker | WebSocket;

  constructor(connection: Worker | WebSocket, remoteType: DbType) {
    this.remoteType = remoteType;
    this.connection = connection;
  }
  send(msg: DielRemoteMessage) {
    // FIXME: deal with nulls etc.
    // action creation logic:
    // DefineRelations: exec for Worker, and run for socket...
    if (this.remoteType === DbType.Worker) {
      // FIXME: might need some adaptor logic here to make worker the same as socket
      (this.connection as Worker).postMessage({
        action: DielRemoteActionToEngineActionWorker.get(msg.id.remoteAction),
        ...msg
      });
    } else {
      // FIXME: clear serialization logic
      const newMessage = {
        id: JSON.stringify(msg.id),
        action: DielRemoteActionToEngineActionSocket.get(msg.id.remoteAction),
        sql: msg.sql,
        dbName: msg.dbName,
        buffer: msg.buffer
      };
      (this.connection as WebSocket).send(JSON.stringify(newMessage));
    }
  }

  // FIXME: maybe don't need this since they have the same name
  setHandler(f: (event: any) => void) {
    if (this.remoteType === DbType.Worker) {
      (this.connection as Worker).onmessage = f;
    } else {
      (this.connection as WebSocket).onmessage = f;
    }
  }
}

export type NodeDependency = Map<string, Set<string>>;

export default class Remote {
  remoteType: DbType;
  id: DbIdType;
  // map from output to views to share
  staticShare: NodeDependency;
  viewSharingCb: NewInputManyFuncType;
  resolves: any;
  rejects: any;
  globalMsgId: number;
  connection: ConnectionWrapper;
  // for now assume that we only need to sahre to main
  // based on the input that changed
  viewsToShare: NodeDependency;
  // for sockets, it will look like 'ws://localhost:8999'
  // and for workers, it will look like a file path to the db.
  constructor(remoteType: DbType, remoteId: number, viewSharingCb: NewInputManyFuncType) {
    this.remoteType = remoteType;
    this.id = remoteId;
    this.viewSharingCb = viewSharingCb;
    this.globalMsgId = 0;
    this.resolves = {};
    this.rejects = {};
  }

  public SetStaticShare(viewsToShareByOutput: NodeDependency) {
    if (this.staticShare) {
      LogInternalError(`Setting the static views to share again!`);
    }
    this.staticShare = viewsToShareByOutput;
  }

  public SetViewsToShare(viewsToShare: NodeDependency) {
    if (this.viewsToShare) {
      LogInternalError(`Setting the dynamic views to Share again!`);
    }
    this.viewsToShare = viewsToShare;
  }

  public GetStaticViewsForOutput(outputName: string) {
    // should implement caching here
    const views = this.staticShare.get(outputName);
    views.forEach(item => {
      const msg: DielRemoteMessage = {
        id: {
          view: item,
          lineage: -1,
          remoteAction: DielRemoteAction.GetViewsToShare
        },
        sql: `select * from ${item}`,
        // action: "exec",
      };
      // need to pass the lineage information on
      this.SendMsg(msg, false);
    });
  }

  async setup(connectionString: string, dbName?: string) {
    if (this.remoteType === DbType.Worker) {
      const newConnection = new Worker(WebWorkerSqlPath);
      this.connection = new ConnectionWrapper(newConnection, this.remoteType);
      // note that this must be set before the await is called, otherwise we get into a dealock!
      // same code for socket for below as well
      this.connection.setHandler(this.getHandleMsgForRemote());
      const response = await fetch(connectionString);
      const bufferRaw = await response.arrayBuffer();
      const buffer = new Uint8Array(bufferRaw);
      // we should block because if it's not ack-ed the rest of the messages cannot be processed properly
      await this.SendMsg({
        id: {remoteAction: DielRemoteAction.ConnectToDb},
        // action: "open",
        buffer,
      }, true);
    } else {
      try {
        const socket = await connectToSocket(connectionString);
        this.connection = new ConnectionWrapper(socket, this.remoteType);
        this.connection.setHandler(this.getHandleMsgForRemote());
        if (dbName) {
          await this.SendMsg({
            id: {remoteAction: DielRemoteAction.ConnectToDb},
            // action: "open",
            dbName
          }, true);
        }
      } catch (e) {
        ReportDielUserError(`Socket ${connectionString} had error: ${e}.`);
      }
    }
    // FIXME: weird, socket and webworkers share the same messageevent?
    // (msg: MessageEvent) => {
    //   console.log(`Remote ${this.id} handling msg ${msg}`);
    //   const dielMsg = msg.data as DielRemoteMessage;
    //   if (dielMsg.id.remoteAction === DielRemoteAction.ConnectToDb) {
    //     this.connection.setHandler();
    //   }
    // });
  }

  // FIXME: types are missing
  public SendMsg(msg: DielRemoteMessage, isPromise = false): Promise<DielRemoteReply> | null {
    console.log("sending message", msg);
    // if (customId.indexOf("-") > -1) {
    //   LogInternalError(`ID cannot contain protected character "-", but you used ${customId}`);
    // }
    if (isPromise) {
      const msgId = this.globalMsgId++;
      msg.id.msgId = msgId;
      const self = this;
      return new Promise(function (resolve, reject) {
        // save callbacks for later
        self.resolves[msgId] = resolve;
        self.rejects[msgId] = reject;
        (self.connection).send(msg);
      });
    } else {
      this.connection.send(msg);
      return null;
    }
  }

  // each worker's handling is a little different
  getHandleMsgForRemote() {
    const self = this;
    // FIXME: look into how to get real errors
    const handleMsg = (event: MessageEvent) => {
      console.log(`Remote ${this.id} (${this.remoteType}) handling message`, event);
      // if this is socket we need to unpack all
      // but if this is worker, then we just need to unpack id...
      // so annoying
      let msg: DielRemoteReply | undefined;
      if (this.remoteType === DbType.Socket) {
        try {
          msg = parseDielReply(event.data);
        } catch (e) {
          console.log(`%cSocket sent mal-formatted message: ${JSON.stringify(event.data, null, 2)}`, "color: red");
          return;
        }
      } else {
        if (event.data.id) {
          msg = {
            id: event.data.id as DielRemoteMessageId,
            results: parseSqlJsWorkerResult(event.data.results),
            err: event.data.err
          };
         } else {
          console.log(`%c\nWorker sent mal-formatted message: ${event.data}`, "color: red");
          return;
         }
        }
      if (msg.id.msgId > -1) {
        const promiseId = msg.id.msgId;
        if (msg.err) {
          // error condition
          const reject = self.rejects[promiseId];
          if (reject) {
            reject(msg.err);
          }
        } else {
          const resolve = self.resolves[promiseId];
          if (resolve) {
            resolve(msg);
          }
        }
        // purge used callbacks
        delete self.resolves[promiseId];
        delete self.rejects[promiseId];
      } else {
        const customId = msg.id.remoteAction;
        // TODO: other logic
        if (customId === DielRemoteAction.ShareInputAfterTick) {
          // share the views: exec select * from the view
          // then insert into the table in main
          // the trigger is actually coordianted through allInput table
          for (let item of this.viewsToShare.get(msg.id.input)) {
            const newMsg: DielRemoteMessage = {
              id: {
                view: item,
                input: msg.id.input,
                remoteAction: DielRemoteAction.GetViewsToShare
              },
              sql: `select * from ${item}`,
              // action: "exec",
            };
            // need to pass the lineage information on
            self.SendMsg(newMsg, false);
          }
        } else if (customId === DielRemoteAction.GetViewsToShare) {
          const view = msg.id.view;
          if (!view || !msg.id.lineage) {
            LogInternalError(`Both view and lienage should be defined for sharing views! However, I got ${JSON.stringify(msg.id, null, 2)}`);
          }
          if (msg.results.length > 0) {
            this.viewSharingCb(view, msg.results, msg.id.lineage);
          }
        } else {
          console.log(`%c Got ${customId} and not handled, the msg is ${JSON.stringify(msg)}`, "color: red");
        }
      }
    };
    return handleMsg;
  }

  /**
   * SqlitemasterQuery returns sql and name
   */
  async getMetaData(): Promise<RelationObject> {
    const promise = this.SendMsg({
      id: {remoteAction: DielRemoteAction.GetResultsByPromise},
      // action: "exec",
      sql: SqliteMasterQuery
    }, true);
    const data = await promise;
    return data.results;
    // return processSqliteMasterMetaData(data as any);
  }
}