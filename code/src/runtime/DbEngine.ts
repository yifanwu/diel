import { DbType, RelationObject, DielRemoteAction, DielRemoteMessage, DielRemoteReply, DielRemoteMessageId, RemoteOpenDbMessage, RemoteExecuteMessage, RemoteShipRelationMessage, GetRelationToShipFuncType, RemoteUpdateRelationMessage } from "./runtimeTypes";
import { SqliteMasterQuery, RelationShippingFuncType } from "./DielRuntime";
import { LogInternalError, ReportDielUserError, LogInternalWarning, DielInternalErrorType } from "../lib/messages";
import { DbIdType, LogicalTimestep, RelationIdType, LocalDbId } from "../compiler/DielPhysicalExecution";
import { parseSqlJsWorkerResult } from "./runtimeHelper";
import { IsSuperset, IsSetIdentical } from "../lib/dielUtils";
import { ConnectionWrapper } from "./ConnectionWrapper";
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


const WebWorkerSqlPath = "./UI-dist/worker.sql.js";

export type NodeDependency = Map<string, Set<string>>;

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
  // maps input to anothe map where we look at the relations
  // cachedRelationDependencies: Map<RelationIdType, RelationDependency>;
  // getRelationsToShipAfterUpdate: GetRelationToShipFuncType;
  relationShippingCallback: RelationShippingFuncType;
  connection: ConnectionWrapper;
  // set up later
  getRelationDependencies: (id: DbIdType, lineage: LogicalTimestep) => Map<RelationIdType, Set<RelationIdType>>;
  getRelationDestinations: (id: DbIdType, lineage: LogicalTimestep) => Map<RelationIdType, Set<DbIdType>>;

  // for sockets, it will look like 'ws://localhost:8999'
  // and for workers, it will look like a file path to the db.
  constructor(remoteType: DbType,
              remoteId: number,
              relationShippingCallback: RelationShippingFuncType,
          ) {
    this.remoteType = remoteType;
    this.id = remoteId;
    this.relationShippingCallback = relationShippingCallback;
  }

  setupByPhysicalExecution(
    getRelationDependencies: (id: DbIdType, lineage: LogicalTimestep) => Map<RelationIdType, Set<RelationIdType>>,
    getRelationDestinations: (id: DbIdType, lineage: LogicalTimestep) => Map<RelationIdType, Set<DbIdType>>
  ) {
    this.getRelationDestinations = getRelationDestinations;
    this.getRelationDependencies = getRelationDependencies;
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
    } else if (this.remoteType === DbType.Socket) {
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
    } else if (this.remoteType === DbType.Local) {
      LogInternalError(`Should not use DbEngine wrapper for local`);
      // if (connectionString) {
      // } else {
      // }
    } else {
      LogInternalError(`handle different connections`, DielInternalErrorType.UnionTypeNotAllHandled);
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
        this.connection.send(id, msgToSend, false);
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
      lineage: msg.lineage,
    };
    switch (msg.remoteAction) {
      case DielRemoteAction.ConnectToDb: {
        const opMsg = msg as RemoteOpenDbMessage;
        if (this.remoteType === DbType.Worker) {
          const buffer = opMsg.buffer;
          const msgToSend = {
            buffer
          };
          return this.connection.send(id, msgToSend, isPromise);
        } else {
          const dbName = opMsg.dbName;
          const msgToSend = {
            dbName
          };
          return this.connection.send(id, msgToSend, isPromise);
        }
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
          // if (isPromise) {
          //   LogInternalError(`Cannot wait on Promise ${DielRemoteAction.UpdateRelation}`);
          // }
          return this.connection.send(id, msgToSend, isPromise);
          // this.queueMap.get(updateMsg.lineage).receivedValues.set(updateMsg.relationName, updateMsg);
        } else {
          this.queueMap.get(msg.lineage).receivedValues.push(updateMsg);
        }
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
        return this.connection.send(id, msgToSend, isPromise);
      }
      case DielRemoteAction.GetResultsByPromise: {
        const sql = (msg as RemoteExecuteMessage).sql;
        const msgToSend = {
          sql
        };
        return this.connection.send(id, msgToSend, true);
      }
      default:
        LogInternalError(`DielRemoteAction ${msg.remoteAction} not handled`);
    }
  }

  getHandleMsgForRemote() {
    const handleMsg = (msg: DielRemoteReply) => {
      console.log(`Remote ${this.id} (${this.remoteType}) handling message`, event);
      // if this is socket we need to unpack all, but if this is worker, then we just need to unpack id... so annoying
      switch (msg.id.remoteAction) {
        case DielRemoteAction.UpdateRelation: {
          this.evaluateQueueOnUpdateHandler();
          break;
        }
        case DielRemoteAction.GetResultsByPromise: {
          console.log(`Db get results for ${this.id} done.`);
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
        case DielRemoteAction.ConnectToDb: {
          console.log(`Db opened for ${this.id}`);
          break;
        }
        default:
          LogInternalError(``, DielInternalErrorType.UnionTypeNotAllHandled);
      }
    };
    return handleMsg;
  }

  /**
   * SqlitemasterQuery returns sql and name
   */
  async getMetaData(id: DbIdType): Promise<{id: DbIdType, data: RelationObject}> {
    const promise = this.SendMsg({
      remoteAction: DielRemoteAction.GetResultsByPromise,
      sql: SqliteMasterQuery
    }, true);
    const data = await promise;
    return {
      id,
      data: data.results
    };
  }
}