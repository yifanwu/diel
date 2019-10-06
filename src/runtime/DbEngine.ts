import { DbType, RelationObject, DielRemoteAction, DielRemoteMessage, DielRemoteReply, RemoteOpenDbMessage, RemoteExecuteMessage, RemoteShipRelationMessage, RemoteUpdateRelationMessage } from "./runtimeTypes";
import { SqliteMasterQuery, RelationShippingFuncType, INIT_TIMESTEP } from "./DielRuntime";
import { LogInternalError, ReportDielUserError, LogInternalWarning, DielInternalErrorType, LogInfo, LogExecutionTrace, LogSetup } from "../util/messages";
import { LocalDbId, DielPhysicalExecution } from "../compiler/DielPhysicalExecution";
import { IsSetIdentical } from "../util/dielUtils";
import { ConnectionWrapper } from "./ConnectionWrapper";
import { LogicalTimestep, RelationNameType, DbIdType } from "../parser/dielAstTypes";
import { RecordObject } from "..";

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
  dbDriver: DbDriver;
}

export interface SocketConfig extends DbSetupConfigBase {
  connection: string;
  message?: any; // JSON string to send to the server for setup
  tableDef?: RecordObject[];
}

export enum DbDriver {
  SQLite = "SQLite",
  Postgres = "Postgres",
  MySQL = "MySQL"
}

export interface WorkerConfig extends DbSetupConfigBase {
  jsFile: string;
  dataFile?: string;
}

export interface TableDef {
  name: string;
  sql: string;
}

export type DbSetupConfig = SocketConfig | WorkerConfig;

export default class DbEngine {
  // for debugging
  totalMsgCount: number;
  msgCountTimeStamp: number;
  // for execution
  currentQueueHead: LogicalTimestep | null;
  physicalExeuctionRef: DielPhysicalExecution;
  queueMap: Map<LogicalTimestep, {
    deps: Set<RelationNameType>;
    received: Set<RelationNameType>;
    receivedValues: RemoteUpdateRelationMessage[];
    relationsToShip: Map<RelationNameType, Set<DbIdType>>;
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

  public Close() {
    switch (this.config.dbType) {
      case DbType.Worker:
        const id = {
          remoteAction: DielRemoteAction.Close,
          // timestep not needed...
          requestTimestep: -1
        };
        // the sql is also not needed
        this.connection.send(id, {sql: ""}, false);
      case DbType.Socket:
    }
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
          requestTimestep: INIT_TIMESTEP,
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
              requestTimestep: INIT_TIMESTEP,
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

  private async nextQueue(): Promise<void> {
    if (this.currentQueueHead) this.queueMap.delete(this.currentQueueHead);
    this.currentQueueHead = null;
    // if there is more in the queue to address, deal with them
    if (this.queueMap.size > 0) {
      this.currentQueueHead = Math.min(...this.queueMap.keys());
      // also load the next queue's results in
      const currentQueueMap = this.queueMap.get(this.currentQueueHead);
      if (!currentQueueMap) {
        LogInternalError(`CurrentQueneMap not defined`);
        return;
      }
      const promises = currentQueueMap.receivedValues.map(async updateMsg => {
        const id = {
          remoteAction: updateMsg.remoteAction,
          msgId: updateMsg.msgId,
          requestTimestep: updateMsg.requestTimestep,
        };
        const msgToSend = this.extendMsgWithCustom({
          sql: updateMsg.sql,
        });
        await this.connection.send(id, msgToSend, true);
      });
      await Promise.all(promises);
      // note that this must be evaluated after the messages have actually finished executing
      // which means asynchrony!
      await this.evaluateQueueOnUpdateHandler();
    } else {
      // debugger;
      LogExecutionTrace(`Setting current queue head to null`);
    }
  }

  // RECURSIVE
  private async evaluateQueueOnUpdateHandler(): Promise<null> {
    if (!this.currentQueueHead) {
      // if there is no queue, skip
      if (this.queueMap.size === 0) {
        return null;
      }
      const queueKeys = this.queueMap.keys();
      // this is the first time
      this.currentQueueHead = Math.min(...queueKeys);
    }
    const currentItem = this.queueMap.get(this.currentQueueHead);
    if (!currentItem) {
      return LogInternalError(`Queue should contain current head ${this.currentQueueHead}, but it contains ${this.queueMap.keys()}!`);
    }
    LogExecutionTrace(`Attempting to process queue at ${this.currentQueueHead}`, this.queueMap);
    // coarse grained
    const currentQueueHead = this.currentQueueHead;
    if (!currentQueueHead) return LogInternalError(`Curretn quene head shoudl be defined!`);
    if (IsSetIdentical(currentItem.received, currentItem.deps)) {
      console.log(`  Success Processing queue at ${this.currentQueueHead}`, currentItem.relationsToShip);
      await currentItem.relationsToShip.forEach(async (destinations, relationName) => {
        await destinations.forEach(async dbId => {
          const shipMsg: RemoteShipRelationMessage = {
            remoteAction: DielRemoteAction.ShipRelation,
            requestTimestep: currentQueueHead,
            relationName,
            dbId
          };
          await this.SendMsg(shipMsg, true);
        });
      });
      // let's make sure that this is sent...
      // debugger;
      this.nextQueue();
      return null;
    } else {
      console.log(`  Failure! Two sets are not the same`, currentItem.received, currentItem.deps);
      // need to keep on waiting
      return null;
    }
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
    LogExecutionTrace(`Received message. Worker attempting to action ${msg.remoteAction} for request step ${msg.requestTimestep}`, msg);
    this.totalMsgCount++;
    this.sanityCheck();
    const id = {
      remoteAction: msg.remoteAction,
      requestTimestep: msg.requestTimestep,
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
          const message = opMsg.message ? opMsg.message : "";
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
        if (!this.physicalExeuctionRef) return LogInternalError(`should have reference to phsyical execution by now`);
        const updateMsg = msg as RemoteUpdateRelationMessage;
        // push this on to the message queue
        if (this.queueMap.has(updateMsg.requestTimestep)) {
          const requestTimestepQueue = this.queueMap.get(updateMsg.requestTimestep);
          if (!requestTimestepQueue) {
            return LogInternalError(``);
          }
          requestTimestepQueue.received.add(updateMsg.relationName);
        } else {
          const rToShip = this.physicalExeuctionRef.getRelationsToShipForDb(this.id, msg.requestTimestep);
          if (!rToShip) {
            return LogInternalError(``);
          }
          this.queueMap.set(msg.requestTimestep, {
            receivedValues: [],
            received: new Set([updateMsg.relationName]),
            relationsToShip: rToShip.relationsToShip,
            deps: rToShip.deps
          });
          LogExecutionTrace(`Setting queue with new request timestep ${msg.requestTimestep}`);
        }
        // then process
        // the following is brittle, but if we don't set it, the queue just keeps going
        if (!this.currentQueueHead) this.currentQueueHead = msg.requestTimestep;
        if (msg.requestTimestep === this.currentQueueHead) {
          LogExecutionTrace(`Executing immediately as received, with request timestep: ${msg.requestTimestep}`);
          // can actually execute execute
          // figure out the dbname if it's there.
          const msgToSend = this.extendMsgWithCustom({
            sql: updateMsg.sql
          });
          return this.connection.send(id, msgToSend, isPromise);
        } else {
          LogExecutionTrace(`CANNOT execute immediately, pushing request timestep: ${msg.requestTimestep} to queue`);
          // otherwise push on the queue
          const requestTimestepQueue = this.queueMap.get(updateMsg.requestTimestep);
          if (!requestTimestepQueue) {
            return LogInternalError(`requestTimestepQuee null`);
          }
          requestTimestepQueue.receivedValues.push(updateMsg);
          return null;
        }
      }
      case DielRemoteAction.DefineRelations: {
        const defineMsg = msg as RemoteExecuteMessage;
        const msgToSend = this.extendMsgWithCustom({
          sql: defineMsg.sql,
        });
        LogSetup(`Running Query in Remote[${this.id}]:\n${defineMsg.sql}`);
        return this.connection.send(id, msgToSend, isPromise);
      }
      case DielRemoteAction.ShipRelation: {
        if (!this.physicalExeuctionRef) return LogInternalError(`should have reference to phsyical execution by now`);
        const shipMsg = msg as RemoteShipRelationMessage;
        const newId = {
          ...id,
          relationName: shipMsg.relationName,
        };
        // if (isPromise) {
        //   LogInternalError(`You cannot wait on ${DielRemoteAction.ShipRelation}`);
        // }
        // also need to check if it's being shipped to itself, in which case, we need to bubble up
        // this is assumed to be only for static relations... might be wrong
        if (shipMsg.dbId === this.id) {
          // note that this is a good hook for materialization
          // LogInfo(`Shipping to itself, this is a local evaluation`);
          LogInternalError(`why is this happening...`);
          // in theory I think we can just invoke the connection directly.
          // staticShip.map(t => {
          //   const staticMsg: RemoteShipRelationMessage = {
          //     remoteAction: DielRemoteAction.ShipRelation,
          //     relationName: t.relation,
          //     dbId: t.destination,
          //     requestTimestep: msg.requestTimestep,
          //   };
          //   this.SendMsg(staticMsg);
          // });
          // return null;
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

  /**
   * This function generates the handler for when the original messages (i.e., actions to the databases)
   *   have been completed.
   */
  getHandleMsgForRemote() {
    const handleMsg = async (msg: DielRemoteReply): Promise<void> => {
      // if this is socket we need to unpack all, but if this is worker, then we just need to unpack id... so annoying
      switch (msg.id.remoteAction) {
        case DielRemoteAction.UpdateRelation: {
          await this.evaluateQueueOnUpdateHandler();
          LogExecutionTrace(`Finished UpdateRelation and queue evaluation`);
          break;
        }
        case DielRemoteAction.GetResultsByPromise: {
          console.log(`Db get results for ${this.id} done.`);
          break;
        }
        case DielRemoteAction.ShipRelation: {
          const view = msg.id.relationName;
          if (!view || !msg.id.requestTimestep) {
            LogInternalError(`Both view and request_timestep should be defined for sharing views! However, I got ${JSON.stringify(msg.id, null, 2)}`);
            return;
          }
          if (msg.results.length > 0) {
            this.relationShippingCallback(view, msg.results, msg.id.requestTimestep);
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
      if (Date.now() - this.msgCountTimeStamp < 1000) {
        LogInternalError(`Too many messages:`);
      } else {
        this.totalMsgCount = 0;
        this.msgCountTimeStamp = Date.now();
      }
    }
  }

  setPhysicalExecutionReference(physicalExeuctionRef: DielPhysicalExecution) {
    console.log("setting physical exeuction reference", this.id);
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
   *  Returns {id, [{sql, name} ... ]}
   */
  async getMetaData(id: DbIdType): Promise<{id: DbIdType, data: RelationObject | null}> {
    if (this.config.dbDriver === DbDriver.Postgres) {
      return {
        id,
        data: (<SocketConfig> this.config).tableDef,
      };
    } else {
      const promise = this.SendMsg({
        remoteAction: DielRemoteAction.GetResultsByPromise,
        requestTimestep: INIT_TIMESTEP, // might change later because we can load new databases later?
        // sql: this.config.dbDriver
        sql: SqliteMasterQuery,
      }, true);
      const data = await promise;
      return {
        id,
        data: data ? data.results : null
      };
    }

  }
}