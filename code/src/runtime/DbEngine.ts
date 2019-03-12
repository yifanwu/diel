import { DbType, RelationObject, DielRemoteAction, DielRemoteMessage, DielRemoteReply, DielRemoteMessageId, RemoteOpenDbMessage, RemoteExecuteMessage, RemoteShipRelationMessage, GetRelationToShipFuncType, RemoteUpdateRelationMessage } from "./runtimeTypes";
import { SqliteMasterQuery, RelationShippingFuncType } from "./DielRuntime";
import { LogInternalError, ReportDielUserError, LogInternalWarning, DielInternalErrorType } from "../lib/messages";
import { DbIdType, LogicalTimestep, RelationIdType, LocalDbId } from "../compiler/DielPhysicalExecution";
import { parseSqlJsWorkerResult } from "./runtimeHelper";
import { IsSuperset, IsSetIdentical } from "../lib/dielUtils";
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

function parseDielReply(rawStr: string): DielRemoteReply {
  let msg = JSON.parse(rawStr);
  msg.id = JSON.parse(msg.id);
  return msg;
}

const WebWorkerSqlPath = "./UI-dist/worker.sql.js";

const DielRemoteActionToEngineActionWorker = new Map<DielRemoteAction, string>([
  [DielRemoteAction.GetResultsByPromise, "exec"],
  [DielRemoteAction.ConnectToDb, "open"],
  [DielRemoteAction.DefineRelations, "exec"],
  [DielRemoteAction.ShipRelation, "exec"]
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

  send(id: {
    remoteAction: DielRemoteAction,
    msgId: number,
    destinationDbId?: DbIdType,
    lineage: LogicalTimestep
  }, msgToSend: {buffer: any} | {sql: string}) {
    if (this.remoteType === DbType.Worker) {
      // FIXME: might need some adaptor logic here to make worker the same as socket
      const action = DielRemoteActionToEngineActionWorker.get(id.remoteAction);
      const worker = (this.connection as Worker);
      // FIXME: JSON.stringify(id) ?
      worker.postMessage({
        id,
        action,
        ...msgToSend
      });
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
  setHandler(f: (event: any) => void) {
    if (this.remoteType === DbType.Worker) {
      (this.connection as Worker).onmessage = f;
    } else {
      (this.connection as WebSocket).onmessage = f;
    }
  }
}

export type NodeDependency = Map<string, Set<string>>;
// type ShipMent = Map<RelationIdType, boolean>;

export default class DbEngine {
  // the queue is complete if all the shipment is sent
  currentQueueHead: LogicalTimestep;
  queueMap: Map<LogicalTimestep, {
    received: Set<RelationIdType>;
    receivedValues: RemoteUpdateRelationMessage[];
    // I might have more than one views, each need their dependency
    relationsToShipDeps: Map<RelationIdType, Set<RelationIdType>>;
    relationsToShipDestinations: Map<RelationIdType, Set<DbIdType>>;
    shipped: Set<RelationIdType>;
  }>;
  remoteType: DbType;
  id: DbIdType;
  getRelationDependencies: (id: DbIdType, lineage: LogicalTimestep) => Map<RelationIdType, Set<RelationIdType>>;
  getRelationDestinations: (id: DbIdType, lineage: LogicalTimestep) => Map<RelationIdType, Set<DbIdType>>;
  // maps input to anothe map where we look at the relations
  // cachedRelationDependencies: Map<RelationIdType, RelationDependency>;
  // getRelationsToShipAfterUpdate: GetRelationToShipFuncType;
  relationShippingCallback: RelationShippingFuncType;
  resolves: any;
  rejects: any;
  globalMsgId: number;
  connection: ConnectionWrapper;
  viewsToShareByEvent: NodeDependency;
  // for sockets, it will look like 'ws://localhost:8999'
  // and for workers, it will look like a file path to the db.
  constructor(remoteType: DbType,
              remoteId: number,
              relationShippingCallback: RelationShippingFuncType,
              getRelationDependencies: (id: DbIdType, lineage: LogicalTimestep) => Map<RelationIdType, Set<RelationIdType>>,
              getRelationDestinations: (id: DbIdType, lineage: LogicalTimestep) => Map<RelationIdType, Set<DbIdType>>
          ) {
    this.remoteType = remoteType;
    this.id = remoteId;
    this.relationShippingCallback = relationShippingCallback;
    this.getRelationDestinations = getRelationDestinations;
    this.getRelationDependencies = getRelationDependencies;
    this.globalMsgId = 0;
    this.resolves = {};
    this.rejects = {};
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
        remoteAction: DielRemoteAction.ConnectToDb,
        buffer,
      }, true);
    } else {
      try {
        const socket = await connectToSocket(connectionString);
        this.connection = new ConnectionWrapper(socket, this.remoteType);
        this.connection.setHandler(this.getHandleMsgForRemote());
        if (dbName) {
          await this.SendMsg({
            remoteAction: DielRemoteAction.ConnectToDb,
            dbName
          }, true);
        }
      } catch (e) {
        ReportDielUserError(`Socket ${connectionString} had error: ${e}.`);
      }
    }
  }

  /**
   * FIXME: add caching
   * only things that are supposed to change on this tick, or was not recieved need to be waited on
   * things that will change are the things dependent on the event, we can record that.
   */
  // private getShipment(inputEvent?: RelationIdType): ShipMent {
  //   const ship = new Map<RelationIdType, boolean>();
  //   this.getRelationDependencies(this.id, inputEvent);
  //   // if (!this.cachedRelationDependencies.has(inputEvent)) {
  //   //   this.cachedRelationDependencies.set(inputEvent, ;
  //   // }
  //   // for (let relationName of this.cachedRelationDependencies.get(inputEvent).keys()) {
  //   //   ship.set(relationName, false);
  //   // }
  //   return ship;
  // }

  // RECURSIVE
  private evaluateQueueOnUpdateHandler() {
    if (!this.currentQueueHead) {
      // this is the first time
      this.currentQueueHead = Math.min(...this.queueMap.keys());
    }
    const currentItem = this.queueMap.get(this.currentQueueHead);
    if (!currentItem) {
      LogInternalError(`Queue should contain current head!`);
    }
    currentItem.relationsToShipDeps.forEach((deps, relationName) => {
      if (!currentItem.shipped.has(relationName)) {
        if (IsSuperset(currentItem.received, deps)) {
          // then ship, and set
          currentItem.relationsToShipDestinations.get(relationName).forEach(dbId => {
            const shipMsg: RemoteShipRelationMessage = {
              remoteAction: DielRemoteAction.ShipRelation,
              relationName,
              dbId
            };
            this.SendMsg(shipMsg);
          });
          currentItem.shipped.add(relationName);
        }
      }
    });
    // if all has shipped, let's delete
    if (currentItem.shipped.size === currentItem.relationsToShipDeps.size) {
      // now let's delete
      this.queueMap.delete(this.currentQueueHead);
      this.currentQueueHead = Math.min(...this.queueMap.keys());
      // also load the next queue's results in
      this.queueMap.get(this.currentQueueHead).receivedValues.map(updateMsg => {
        const id = {
          remoteAction: updateMsg.remoteAction,
          msgId: updateMsg.msgId,
          lineage: updateMsg.lineage,
        };
        const msgToSend = {
          sql: updateMsg.sql
        };
        this.connection.send(id, msgToSend);
      });
      this.evaluateQueueOnUpdateHandler();
    } else {
      return;
    }
  }

  public SendMsg(msg: DielRemoteMessage, isPromise = false): Promise<DielRemoteReply> | null {
    console.log("sending message", msg);
    // if (customId.indexOf("-") > -1) {
    //   LogInternalError(`ID cannot contain protected character "-", but you used ${customId}`);
    // }
    // let msgToSend: {buffer: any} | {sql: string};
    const id = {
      remoteAction: msg.remoteAction,
      msgId: msg.msgId,
      lineage: msg.lineage,
    };
    switch (msg.remoteAction) {
      case DielRemoteAction.ConnectToDb: {
        const buffer = (msg as RemoteOpenDbMessage).buffer;
        const msgToSend = {
          buffer
        };
        this.connection.send(id, msgToSend);
        return;
      }
      case DielRemoteAction.UpdateRelation: {
        const updateMsg = msg as RemoteUpdateRelationMessage;
        // we need to see if previous has been processed
        // if so actually execute
        // else, put on an event queue
        // now is the case where msg.lineage is larger
        if (this.queueMap.has(updateMsg.lineage)) {
          this.queueMap.get(updateMsg.lineage).received.add(updateMsg.relationName);
        } else {
          this.queueMap.set(msg.lineage, {
            receivedValues: [],
            received: new Set([updateMsg.relationName]),
            relationsToShipDeps: this.getRelationDependencies(this.id, msg.lineage),
            shipped: new Set(),
            relationsToShipDestinations: this.getRelationDestinations(this.id, msg.lineage)
          });
        }
        // push this on to the message queue
        if ((!this.currentQueueHead) || (msg.lineage === this.currentQueueHead)) {
          // then execute
          const msgToSend = {
            sql: updateMsg.sql
          };
          this.connection.send(id, msgToSend);
          // this.queueMap.get(updateMsg.lineage).receivedValues.set(updateMsg.relationName, updateMsg);
        } else {
          this.queueMap.get(msg.lineage).receivedValues.push(updateMsg);
        }
        return;
      }
      case DielRemoteAction.DefineRelations: {
        break;
      }
      case DielRemoteAction.ShipRelation: {
        const shipMsg = msg as RemoteShipRelationMessage;
        if ((this.id !== LocalDbId) && (shipMsg.dbId !== LocalDbId)) {
          // this case is not yet supported
          LogInternalError(`Shipping across remote engines`, DielInternalErrorType.NotImplemented);
        }
        const msgToSend = {
          sql: `select * from ${shipMsg.relationName};`
        };
        this.connection.send(id, msgToSend);
        return;
      }
      case DielRemoteAction.GetResultsByPromise: {
        const sql = (msg as RemoteExecuteMessage).sql;
        const msgToSend = {
          sql
        };
        // do the promise thing here
        const msgId = this.globalMsgId++;
        msg.msgId = msgId;
        const self = this;
        return new Promise(function (resolve, reject) {
          // save callbacks for later
          self.resolves[msgId] = resolve;
          self.rejects[msgId] = reject;
          (self.connection).send(id, msgToSend);
        });
      }
      default:
        LogInternalError(`DielRemoteAction ${msg.remoteAction} not handled`);
    }
  }

  getHandleMsgForRemote() {
    const self = this;
    const handleMsg = (event: MessageEvent) => {
      console.log(`Remote ${this.id} (${this.remoteType}) handling message`, event);
      // if this is socket we need to unpack all, but if this is worker, then we just need to unpack id... so annoying
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
      if (msg.id.msgId > -1) { // this is a promise no need to do anything else
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
        switch (msg.id.remoteAction) {
          case DielRemoteAction.UpdateRelation: {
            this.evaluateQueueOnUpdateHandler();
            break;
          }
          case DielRemoteAction.ShipRelation: {
            const view = msg.id.relationName;
            if (!view || !msg.id.lineage) {
              LogInternalError(`Both view and lineage should be defined for sharing views! However, I got ${JSON.stringify(msg.id, null, 2)}`);
            }
            if (msg.results.length > 0) {
              this.relationShippingCallback(view, msg.results, msg.id.lineage);
            }
            break;
          }
          default:
          console.log(`%c Msg ${JSON.stringify(msg)} is not handled`, "color: red");
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
      remoteAction: DielRemoteAction.GetResultsByPromise,
      sql: SqliteMasterQuery
    }, true);
    const data = await promise;
    return data.results;
  }
}