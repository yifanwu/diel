import { DbType, RelationObject, DielRemoteAction, DielRemoteMessage, DielRemoteReply, DielRemoteMessageId, RemoteOpenDbMessage, RemoteExecuteMessage, RemoteShipRelationMessage, GetRelationToShipFuncType, RemoteUpdateRelationMessage } from "./runtimeTypes";
import { SqliteMasterQuery, RelationShippingFuncType, INIT_TIMESTEP } from "./DielRuntime";
import { LogInternalError, ReportDielUserError, LogInternalWarning, DielInternalErrorType, LogInfo } from "../lib/messages";
import { DbIdType, LogicalTimestep, RelationIdType, LocalDbId, DielPhysicalExecution } from "../compiler/DielPhysicalExecution";
import { ParseSqlJsWorkerResult } from "./runtimeHelper";
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
  totalMsgCount: number; // for debugging
  // the queue is complete if all the shipment is sent
  currentQueueHead: LogicalTimestep;
  physicalExeuctionRef: DielPhysicalExecution;
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
  // getRelationDependencies: (id: DbIdType, lineage: LogicalTimestep) => Map<RelationIdType, Set<RelationIdType>>;
  // getRelationDestinations: (id: DbIdType, lineage: LogicalTimestep) => Map<RelationIdType, Set<DbIdType>>;
  // getBubbledUpRelationToShip: (dbId: DbIdType, relation: RelationIdType) => {destination: DbIdType, relation: RelationIdType}[];
  // for sockets, it will look like 'ws://localhost:8999'
  // and for workers, it will look like a file path to the db.
  constructor(remoteType: DbType,
              remoteId: number,
              relationShippingCallback: RelationShippingFuncType,
          ) {
    this.remoteType = remoteType;
    this.id = remoteId;
    this.totalMsgCount = 0;
    this.queueMap = new Map();
    this.relationShippingCallback = relationShippingCallback;
  }

  setPhysicalExecutionReference(physicalExeuctionRef: DielPhysicalExecution) {
    this.physicalExeuctionRef = physicalExeuctionRef;
  }

  // setupByPhysicalExecution(
  //   getRelationDependencies: (id: DbIdType, lineage: LogicalTimestep) => Map<RelationIdType, Set<RelationIdType>>,
  //   getRelationDestinations: (id: DbIdType, lineage: LogicalTimestep) => Map<RelationIdType, Set<DbIdType>>,
  //   getBubbledUpRelationToShip: (dbId: DbIdType, relation: RelationIdType) => {destination: DbIdType, relation: RelationIdType}[]
  // ) {
  //   this.getRelationDestinations = getRelationDestinations;
  //   this.getRelationDependencies = getRelationDependencies;
  //   this.getBubbledUpRelationToShip = getBubbledUpRelationToShip;
  // }

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
        lineage: INIT_TIMESTEP,
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
            lineage: INIT_TIMESTEP,
            dbName
          }, true);
        }
      } catch (e) {
        ReportDielUserError(`Socket ${connectionString} had error: ${e}.`);
      }
    } else if (this.remoteType === DbType.Local) {
      LogInternalError(`Should not use DbEngine wrapper for local`);
    } else {
      LogInternalError(`handle different connections`, DielInternalErrorType.UnionTypeNotAllHandled);
    }
  }

  // RECURSIVE
  private evaluateQueueOnUpdateHandler() {
    if (!this.currentQueueHead) {
      // this is the first time
      this.currentQueueHead = Math.min(...this.queueMap.keys());
    }
    const currentItem = this.queueMap.get(this.currentQueueHead);
    if (!currentItem) {
      LogInternalError(`Queue should contain current head ${this.currentQueueHead}, but it contains ${this.queueMap.keys()}!`);
    }
    currentItem.relationsToShipDeps.forEach((deps, relationName) => {
      if (!currentItem.shipped.has(relationName)) {
        if (IsSuperset(currentItem.received, deps)) {
          // then ship, and set
          const destinations = currentItem.relationsToShipDestinations.get(relationName);
          if (destinations) {
            destinations.forEach(dbId => {
              const shipMsg: RemoteShipRelationMessage = {
                remoteAction: DielRemoteAction.ShipRelation,
                lineage: this.currentQueueHead,
                relationName,
                dbId
              };
              this.SendMsg(shipMsg);
            });
            currentItem.shipped.add(relationName);
          } else {
            LogInternalWarning(`Might be an error here trying to find what was not defined`);
          }
        }
      }
    });
    // if all has shipped, let's delete
    if (currentItem.shipped.size === currentItem.relationsToShipDeps.size) {
      // now let's delete
      this.queueMap.delete(this.currentQueueHead);
      this.currentQueueHead = null;
      // if there is more in the queue to address, deal with them
      if (this.queueMap.size > 0) {
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
      }
    } else {
      return;
    }
  }

  public SendMsg(msg: DielRemoteMessage, isPromise = false): Promise<DielRemoteReply> | null {
    console.log("sending message", msg);
    this.totalMsgCount++;
    // FIXME: remove this for production
    if (this.totalMsgCount > 100) {
      LogInternalError(`Too many messages`);
    }
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
            relationsToShipDeps: this.physicalExeuctionRef.getRelationDependenciesForDb(this.id, msg.lineage),
            shipped: new Set(),
            relationsToShipDestinations: this.physicalExeuctionRef.getRelationsToShipForDb(this.id, msg.lineage)
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
        const defineMsg = msg as RemoteExecuteMessage;
        const msgToSend = {
          sql: defineMsg.sql
        };
        console.log(`%c Running Query in Remote[${this.id}]:\n${defineMsg.sql}`, "color: pink");
        return this.connection.send(id, msgToSend, isPromise);
      }
      case DielRemoteAction.ShipRelation: {
        debugger;
        const shipMsg = msg as RemoteShipRelationMessage;
        const newId = {
          ...id,
          relationName: shipMsg.relationName,
        };
        if (isPromise) {
          LogInternalError(`You cannot wait on ${DielRemoteAction.ShipRelation}`);
        }
        // also need to check if it's being shipped to itself, in which case, we need to bubble up
        if (shipMsg.dbId === this.id) {
          // note that this is a good hook for materialization
          LogInfo(`Shipping to itself, this is a local evaluation`);
          const staticShip = this.physicalExeuctionRef.getBubbledUpRelationToShip(this.id, shipMsg.relationName);
          // in theory I think we can just invoke the connection directly.
          staticShip.map(t => {
            const staticMsg: RemoteShipRelationMessage = {
              remoteAction: DielRemoteAction.ShipRelation,
              relationName: t.relation,
              dbId: t.destination,
              lineage: msg.lineage,
            };
            this.SendMsg(staticMsg);
          });
          return;
        }
        // else
        if ((this.id !== LocalDbId) && (shipMsg.dbId !== LocalDbId)) {
          // this case is not yet supported
          LogInternalError(`Shipping across remote engines from ${this.id} to ${shipMsg.dbId}`, DielInternalErrorType.NotImplemented);
          return;
        }
        const msgToSend = {
          sql: `select * from ${shipMsg.relationName};`
        };
        return this.connection.send(newId, msgToSend, isPromise);
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
        case DielRemoteAction.DefineRelations: {
          console.log(`Relations defined successfully for ${this.id}`);
          break;
        }
        case DielRemoteAction.ConnectToDb: {
          console.log(`Db opened for ${this.id}`);
          break;
        }
        default:
          LogInternalError(`You should handle ${msg.id.remoteAction} as well`, DielInternalErrorType.UnionTypeNotAllHandled);
      }
    };
    return handleMsg;
  }

  public downloadDb() {
    // only available on workers
    if (this.remoteType === DbType.Worker) {
      (this.connection.connection as Worker).postMessage({
        id: "download",
        action: "export",
      });
    } else {
      LogInternalWarning(`You cannot download anything that's not Workers here`);
    }
  }

  /**
   * SqlitemasterQuery returns sql and name
   */
  async getMetaData(id: DbIdType): Promise<{id: DbIdType, data: RelationObject}> {
    const promise = this.SendMsg({
      remoteAction: DielRemoteAction.GetResultsByPromise,
      lineage: INIT_TIMESTEP, // might change later because we can load new databases later?
      sql: SqliteMasterQuery
    }, true);
    const data = await promise;
    return {
      id,
      data: data.results
    };
  }
}