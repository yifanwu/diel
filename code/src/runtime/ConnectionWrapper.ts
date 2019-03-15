import { DbType, DielRemoteAction, DielRemoteReply, DielRemoteMessageId } from "./runtimeTypes";
import { DbIdType, LogicalTimestep } from "../compiler/DielPhysicalExecution";
import { ParseSqlJsWorkerResult } from "./runtimeHelper";
import { downloadHelper } from "../lib/dielUtils";
import { LogInfo, LogInternalError } from "../lib/messages";

type FinalMsgType = {buffer: any} | {sql: string} | {dbName: string};

// Things that need to be passed back!
type FinalIdType = {
  remoteAction: DielRemoteAction,
  destinationDbId?: DbIdType,
  lineage: LogicalTimestep
};

interface FinalPromiseIdType extends FinalIdType {
  msgId: number;
}
const DielRemoteActionToEngineActionWorker = new Map<DielRemoteAction, string>([
  [DielRemoteAction.GetResultsByPromise, "exec"],
  [DielRemoteAction.UpdateRelation, "exec"],
  [DielRemoteAction.ConnectToDb, "open"],
  [DielRemoteAction.DefineRelations, "exec"],
  [DielRemoteAction.ShipRelation, "exec"]
]);
const DielRemoteActionToEngineActionSocket = new Map(DielRemoteActionToEngineActionWorker);
DielRemoteActionToEngineActionSocket.set(DielRemoteAction.DefineRelations, "run");
DielRemoteActionToEngineActionSocket.set(DielRemoteAction.UpdateRelation, "run");


// to unify worker and websocket
export class ConnectionWrapper {
  resolves: Map<number, any>;
  rejects: Map<number, any>;
  globalMsgId: number;
  remoteType: DbType;
  connection: Worker | WebSocket;

  constructor(connection: Worker | WebSocket, remoteType: DbType) {
    this.remoteType = remoteType;
    this.connection = connection;
    this.globalMsgId = 1;
    this.resolves = new Map();
    this.rejects = new Map();
  }

  public send(id: FinalIdType, msgToSend: FinalMsgType, isPromise: boolean): Promise<DielRemoteReply> | null  {
    if (isPromise) {
      // do the promise thing here
      const msgId = this.globalMsgId;
      this.globalMsgId += 1;
      const self = this;
      return new Promise(function (resolve, reject) {
        // save callbacks for later
        self.resolves.set(msgId, resolve);
        self.rejects.set(msgId, reject);
        self.sendNoPromise({...id, msgId}, msgToSend);
      });
    } else {
      this.sendNoPromise(id, msgToSend);
    }
  }

  private sendNoPromise(id: FinalIdType | FinalPromiseIdType, msgToSend: FinalMsgType) {
    if (this.remoteType === DbType.Worker) {
      // FIXME: might need some adaptor logic here to make worker the same as socket
      const action = DielRemoteActionToEngineActionWorker.get(id.remoteAction);
      if (!action) {
        LogInternalError(`Action must be defined, but not for ${id.remoteAction}`);
      }
      const worker = (this.connection as Worker);
      // FIXME: JSON.stringify(id) ?
      const finalMsg = {
        id,
        action,
        ...msgToSend
      };
      LogInfo(`Posting to Worker`, finalMsg);
      worker.postMessage(finalMsg);
    } else {
      // FIXME: clear serialization logic
      const action = DielRemoteActionToEngineActionSocket.get(id.remoteAction);
      const newMessage = {
        id,
        action,
        ...msgToSend
      };
      (this.connection as WebSocket).send(JSON.stringify(newMessage));
    }
  }

  // FIXME: maybe don't need this since they have the same name
  setHandler(f: (msg: DielRemoteReply) => void) {
    const self = this;
    const newF = (event: any) => {
      console.log(`Handling message`, event);
      let msg: DielRemoteReply | undefined;
      if (this.remoteType === DbType.Socket) {
        try {
          msg = parseDielReply(event.data);
          // special debugging case
          if ((msg as any).id === "test") return;
        } catch (e) {
          console.log(`%cSocket sent mal-formatted message: ${JSON.stringify(event.data, null, 2)}`, "color: red");
          return;
        }
      } else {
        if (event.data.id) {
          // special debugging case
          if (event.data.id === "test") return;
          if (event.data.id === "download") {
            let blob = new Blob([event.data.buffer]);
            downloadHelper(blob, "workerSession");
            return;
          }
          msg = {
            id: event.data.id as DielRemoteMessageId,
            results: ParseSqlJsWorkerResult(event.data.results),
            err: event.data.err
          };
        } else {
          console.log(`%c\nWorker sent mal-formatted message: ${event.data}`, "color: red");
          return;
        }
      }
      if (msg.id.msgId) {
        const promiseId = msg.id.msgId;
        if (msg.err) {
          // error condition
          const reject = self.rejects.get(promiseId);
          if (reject) {
            reject(msg.err);
          }
        } else {
          const resolve = self.resolves.get(promiseId);
          if (resolve) {
            resolve(msg);
          }
        }
        console.log("Promise resolved", msg);
        // purge used callbacks
        self.resolves.delete(promiseId);
        self.rejects.delete(promiseId);
      }
      console.log("Connector handled", msg, "no promise");
      f(msg);
    };
    if (this.remoteType === DbType.Worker) {
      (this.connection as Worker).onmessage = newF;
    } else {
      (this.connection as WebSocket).onmessage = newF;
    }
  }
}

function parseDielReply(rawStr: string): DielRemoteReply {
  let msg = JSON.parse(rawStr);
  // msg.id = JSON.parse(msg.id);
  return msg;
}