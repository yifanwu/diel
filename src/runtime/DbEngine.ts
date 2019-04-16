import { DbType, RelationObject, DielRemoteAction, DielRemoteMessage, DielRemoteReply, RemoteOpenDbMessage, RemoteExecuteMessage, RemoteShipRelationMessage, RemoteUpdateRelationMessage } from "./runtimeTypes";
import { SqliteMasterQuery, RelationShippingFuncType, INIT_TIMESTEP } from "./DielRuntime";
import { LogInternalError, ReportDielUserError, LogInternalWarning, DielInternalErrorType, LogInfo } from "../util/messages";
import { LocalDbId, DielPhysicalExecution } from "../compiler/DielPhysicalExecution";
import { IsSetIdentical } from "../util/dielUtils";
import { ConnectionWrapper } from "./ConnectionWrapper";
import { LogicalTimestep, RelationIdType, DbIdType } from "../parser/dielAstTypes";

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

interface DbSetupConfigBase {
  dbType: DbType;
}

export interface SocketConfig extends DbSetupConfigBase {
  connection: string;
  message?: any; // JSON string to send to the server for setup
}

export interface WorkerConfig extends DbSetupConfigBase {
  jsFile: string;
  dataFile: string;
}

export type DbSetupConfig = SocketConfig | WorkerConfig;

export type NodeDependency = Map<string, Set<string>>;

export default class DbEngine {
  // for debugging
  totalMsgCount: number;
  msgCountTimeStamp: number;
  // for execution
  currentQueueHead: LogicalTimestep;
  physicalExeuctionRef: DielPhysicalExecution;
  queueMap: Map<LogicalTimestep, {
    deps: Set<RelationIdType>;
    received: Set<RelationIdType>;
    receivedValues: RemoteUpdateRelationMessage[];
    relationsToShip: Map<RelationIdType, Set<DbIdType>>;
  }>;
  config: DbSetupConfig;
  // meta data
  id: DbIdType;
  relationShippingCallback: RelationShippingFuncType;
  // if the connection has multiple databases, then the dbName must be specified
  // dbName?: string;
  connection: ConnectionWrapper;

  constructor(config: DbSetupConfig,
              remoteId: number,
              relationShippingCallback: RelationShippingFuncType,
  ) {
    // this.remoteType = remoteType;
    this.config = config;
    this.id = remoteId;
    this.totalMsgCount = 0;
    this.msgCountTimeStamp = Date.now();
    this.queueMap = new Map();
    this.relationShippingCallback = relationShippingCallback;
  }

  async setup() {
    switch (this.config.dbType) {
      case DbType.Worker:
        const configWorker = this.config as WorkerConfig;
        let newConnection;
        try {
          newConnection = new Worker(configWorker.jsFile);
        } catch (e) {
          return ReportDielUserError(`Error loading worker: ${e}. The path used is ${configWorker.jsFile}.`);
        }
        this.connection = new ConnectionWrapper(newConnection, this.config.dbType);
        // note that this must be set before the await is called, otherwise we get into a dealock!
        // same code for socket for below as well
        this.connection.setHandler(this.getHandleMsgForRemote());
        const response = await fetch(configWorker.dataFile);
        const bufferRaw = await response.arrayBuffer();
        const buffer = new Uint8Array(bufferRaw);
        // we should block because if it's not ack-ed the rest of the messages cannot be processed properly
        return await this.SendMsg({
          remoteAction: DielRemoteAction.ConnectToDb,
          lineage: INIT_TIMESTEP,
          buffer,
        }, true);
      case DbType.Socket:
        const configSocket = this.config as SocketConfig;
        try {
          const socket = await connectToSocket(configSocket.connection);
          this.connection = new ConnectionWrapper(socket, this.config.dbType);
          this.connection.setHandler(this.getHandleMsgForRemote());
          if (configSocket.message) {
            return await this.SendMsg({
              remoteAction: DielRemoteAction.ConnectToDb,
              lineage: INIT_TIMESTEP,
              message: configSocket.message
            }, true);
          }
          // FIXME
          return LogInternalError(`Should not be in this condition`);
        } catch (e) {
          return ReportDielUserError(`Failed to connect to socket at ${configSocket.connection}, with error: ${e}.`);
        }
      case DbType.Local:
        return LogInternalError(`Should not use DbEngine wrapper for local`);
      default:
        return LogInternalError(`handle different connections`, DielInternalErrorType.UnionTypeNotAllHandled);
    }
  }

  private nextQueue() {
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
        const msgToSend = this.extendMsgWithCustom({
          sql: updateMsg.sql,
        });
        this.connection.send(id, msgToSend, false);
      });
      this.evaluateQueueOnUpdateHandler();
    }
  }

  // RECURSIVE
  private evaluateQueueOnUpdateHandler(): null {
    if (!this.currentQueueHead) {
      // this is the first time
      this.currentQueueHead = Math.min(...this.queueMap.keys());
    }
    const currentItem = this.queueMap.get(this.currentQueueHead);
    if (!currentItem) {
      return LogInternalError(`Queue should contain current head ${this.currentQueueHead}, but it contains ${this.queueMap.keys()}!`);
    }
    // coarse grained
    if (IsSetIdentical(currentItem.received, currentItem.deps)) {
      currentItem.relationsToShip.forEach((destinations, relationName) => {
        destinations.forEach(dbId => {
          const shipMsg: RemoteShipRelationMessage = {
            remoteAction: DielRemoteAction.ShipRelation,
            lineage: this.currentQueueHead,
            relationName,
            dbId
          };
          this.SendMsg(shipMsg);
        });
      });
      this.nextQueue();
    }
    // need to keep on waiting
    return null;
  }

  private extendMsgWithCustom(msg: any) {
    switch (this.config.dbType) {
      case DbType.Worker:
        return msg;
      case DbType.Socket:
        return {
          message: (this.config as SocketConfig).message,
          ...msg,
        };
      default:
        LogInternalError(`Shouldn't be any other cases`);
    }
  }

  public SendMsg(msg: DielRemoteMessage, isPromise = false): Promise<DielRemoteReply> | null {
    console.log("sending message", msg);
    this.totalMsgCount++;
    this.sanityCheck();
    const id = {
      remoteAction: msg.remoteAction,
      lineage: msg.lineage,
    };
    switch (msg.remoteAction) {
      case DielRemoteAction.ConnectToDb: {
        const opMsg = msg as RemoteOpenDbMessage;
        if (this.config.dbType === DbType.Worker) {
          const buffer = opMsg.buffer;
          const msgToSend = {
            buffer
          };
          return this.connection.send(id, msgToSend, isPromise);
        } else {
          const message = opMsg.message;
          const msgToSend = {
            message
          };
          return this.connection.send(id, msgToSend, isPromise);
        }
      }
      case DielRemoteAction.CleanUpQueries: {
        const cleanupMsg = msg as RemoteExecuteMessage;
        const msgToSend = this.extendMsgWithCustom({
          sql: cleanupMsg.sql
        });
        return this.connection.send(id, msgToSend, isPromise);
      }
      case DielRemoteAction.UpdateRelation: {
        const updateMsg = msg as RemoteUpdateRelationMessage;
        // push this on to the message queue
        if (this.queueMap.has(updateMsg.lineage)) {
          this.queueMap.get(updateMsg.lineage).received.add(updateMsg.relationName);
        } else {
          const {deps, relationsToShip} = this.physicalExeuctionRef.getRelationsToShipForDb(this.id, msg.lineage);
          this.queueMap.set(msg.lineage, {
            receivedValues: [],
            received: new Set([updateMsg.relationName]),
            relationsToShip,
            deps
          });
        }
        // then process
        if ((!this.currentQueueHead) || (msg.lineage === this.currentQueueHead)) {
          // can actually execute execute
          // figure out the dbname if it's there.
          const msgToSend = this.extendMsgWithCustom({
            sql: updateMsg.sql
          });
          return this.connection.send(id, msgToSend, isPromise);
        } else {
          // otherwise push on the queue
          this.queueMap.get(msg.lineage).receivedValues.push(updateMsg);
          return null;
        }
      }
      case DielRemoteAction.DefineRelations: {
        const defineMsg = msg as RemoteExecuteMessage;
        const msgToSend = this.extendMsgWithCustom({
          sql: defineMsg.sql,
        });
        console.log(`%c Running Query in Remote[${this.id}]:\n${defineMsg.sql}`, "color: pink");
        return this.connection.send(id, msgToSend, isPromise);
      }
      case DielRemoteAction.ShipRelation: {
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
          return null;
        }
        if ((this.id !== LocalDbId) && (shipMsg.dbId !== LocalDbId)) {
          // this case is not yet supported
          LogInternalError(`Shipping across remote engines from ${this.id} to ${shipMsg.dbId}`, DielInternalErrorType.NotImplemented);
          return null;
        }
        const msgToSend = this.extendMsgWithCustom({
          sql: `select * from ${shipMsg.relationName};`,
        });
        return this.connection.send(newId, msgToSend, isPromise);
      }
      case DielRemoteAction.GetResultsByPromise: {
        const sql = (msg as RemoteExecuteMessage).sql;
        const msgToSend = this.extendMsgWithCustom({
          sql,
        });
        return this.connection.send(id, msgToSend, true);
      }
      default:
        return LogInternalError(`DielRemoteAction ${msg.remoteAction} not handled`);
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
        case DielRemoteAction.CleanUpQueries: {
          console.log(`Cleanup queries defined successfully for ${this.id}`);
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

  // hack to prevent loops in messaging logic
  private sanityCheck() {
    // if we send 100 messages within 1 second, probably some loop going on...
    if (this.totalMsgCount > 100) {
      if (this.msgCountTimeStamp - Date.now() < 1000) {
        LogInternalError(`Too many messages`);
      } else {
        this.totalMsgCount = 0;
        this.msgCountTimeStamp = Date.now();
      }
    }
  }

  setPhysicalExecutionReference(physicalExeuctionRef: DielPhysicalExecution) {
    this.physicalExeuctionRef = physicalExeuctionRef;
  }

  public downloadDb() {
    // only available on workers
    if (this.config.dbType === DbType.Worker) {
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