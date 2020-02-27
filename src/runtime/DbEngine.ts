import { DbType, RelationObject, DielRemoteAction, DielRemoteMessage, DielRemoteReply, WorkerOpenDbMessage, RemoteExecuteMessage, RemoteShipRelationMessage, RemoteUpdateRelationMessage } from "./runtimeTypes";
import { SqliteMasterQuery, RelationShippingFuncType, INIT_TIMESTEP } from "./DielRuntime";
import { LogInternalError, ReportDielUserError, LogInternalWarning, DielInternalErrorType, LogInfo, LogExecutionTrace, LogSetup } from "../util/messages";
import { LocalDbId, DielPhysicalExecution } from "../compiler/DielPhysicalExecution";
import { IsSetIdentical } from "../util/dielUtils";
import { ConnectionWrapper } from "./ConnectionWrapper";
import { LogicalTimestep, RelationNameType, DbIdType } from "../parser/dielAstTypes";

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
    const remoteAction = msg.action;
    const requestTimestep = msg.requestTimestep;
    LogExecutionTrace(`Received message. Remote attempting to action ${remoteAction} for request step ${requestTimestep}`, msg);
    this.totalMsgCount++;
    this.sanityCheck();
    const id = {
      remoteAction: remoteAction,
      requestTimestep: requestTimestep,
    };
    switch (remoteAction) {
      // case DielRemoteAction.ConnectToDb: {
      //   const opMsg = msg as WorkerOpenDbMessage;
      //   if (this.config.dbType === DbType.Worker) {
      //     const buffer = opMsg.buffer;
      //     const msgToSend = {
      //       buffer
      //     };
      //     return this.connection.send(id, msgToSend, isPromise);
      //   } else {
      //     const message = opMsg.message ? opMsg.message : "";
      //     const msgToSend = {
      //       message
      //     };
      //     return this.connection.send(id, msgToSend, isPromise);
      //   }
      // }
        return this.connection.send(id, msgToSend, isPromise);
      }
      case DielRemoteAction.UpdateRelation: {
        if (!this.physicalExeuctionRef) return LogInternalError(`should have reference to phsyical execution by now`);
        const updateMsg = msg as RemoteUpdateRelationMessage;
        // push this on to the message queue
        const requestTimestep = updateMsg.requestTimestep;
        if (this.queueMap.has(requestTimestep)) {
          const requestTimestepQueue = this.queueMap.get(requestTimestep);
          if (!requestTimestepQueue) {
            return LogInternalError(``);
          }
          requestTimestepQueue.received.add(updateMsg.updateRelationName);
        } else {
          const rToShip = this.physicalExeuctionRef.getRelationsToShipForDb(this.id, requestTimestep);
          if (!rToShip) {
            return LogInternalError(``);
          }
          this.queueMap.set(msg.requestTimestep, {
            receivedValues: [],
            received: new Set([updateMsg.updateRelationName]),
            relationsToShip: rToShip.relationsToShip,
            deps: rToShip.deps
          });
          LogExecutionTrace(`Setting queue with new request timestep ${requestTimestep}`);
        }
        // then process
        // the following is brittle, but if we don't set it, the queue just keeps going
        if (!this.currentQueueHead) this.currentQueueHead = requestTimestep;
        if (requestTimestep === this.currentQueueHead) {
          LogExecutionTrace(`Executing immediately as received, with request timestep: ${requestTimestep}`);
          // can actually execute execute
          // figure out the dbname if it's there.
          const msgToSend = this.extendMsgWithCustom({
            sql: updateMsg.sql
          });
          return this.connection.send(id, msgToSend, isPromise);
        } else {
          LogExecutionTrace(`CANNOT execute immediately, pushing request timestep: ${requestTimestep} to queue`);
          // otherwise push on the queue
          const requestTimestepQueue = this.queueMap.get(requestTimestep);
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
        return LogInternalError(`DielRemoteAction ${msg.action} not handled`);
    }
  }

  /**
   * This function generates the handler for when the original messages (i.e., actions to the databases)
   *   have been completed.
   */
  getHandleMsgForRemote() {
    const handleMsg = async (msg: DielRemoteReply): Promise<void> => {
      // if this is socket we need to unpack all, but if this is worker, then we just need to unpack id... so annoying
      switch (msg.action) {
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
          const view = msg.relationName;
          if (!view || !msg.requestTimestep) {
            LogInternalError(`Both view and request_timestep should be defined for sharing views! However, I got ${JSON.stringify(msg, null, 2)}`);
            return;
          }
          if (msg.results.length > 0) {
            this.relationShippingCallback(view, msg.results, msg.requestTimestep);
          }
          break;
        }
        // case DielRemoteAction.DefineRelations: {
        //   console.log(`Relations defined successfully for ${this.id}`);
        //   break;
        // }
        // case DielRemoteAction.SetCleanUpQueries: {
        //   console.log(`Cleanup queries defined successfully for ${this.id}`);
        //   break;
        // }
        // case DielRemoteAction.ConnectToDb: {
        //   console.log(`Db opened for ${this.id}`);
        //   break;
        // }
        default:
          LogInternalError(`Message type ${msg.action} not currently handled`, DielInternalErrorType.UnionTypeNotAllHandled);
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
   * SqlitemasterQuery returns sql and name
   */
  async getMetaData(id: DbIdType): Promise<{id: DbIdType, data: RelationObject | null}> {
    const promise = this.SendMsg({
      action: DielRemoteAction.GetResultsByPromise,
      requestTimestep: INIT_TIMESTEP, // might change later because we can load new databases later?
      sql: SqliteMasterQuery
    }, true);
    const data = await promise;
    return {
      id,
      data: data ? data.results : null
    };
  }
}