import * as express from "express";
import * as http from "http";
import * as WebSocket from "ws";
import * as sqlite from "better-sqlite3";

interface DielMessage {
  id: string;
  action: string;
  sql: string;
  dbName?: string;
}

const app = express();

const dbFileLookup = new Map<string, string>([
  ["pitchfork", "./sample-data/pitchfork.sqlite"],
  ["fires", "./sample-data/fires.sqlite"],
  ["tweet", "./sample-data/charlottesville.sqlite"]
]);

// initialize a simple http server
const server = http.createServer(app);

// initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

const FgRed = "\x1b[31m";
const FgBlue = "\x1b[34m";
const Reset = "\x1b[0m";

wss.on("connection", (ws: WebSocket) => {
  let db: sqlite.Database;
  let dbName: string;
  /**
   * Messages should just be
   * (1) one time SQL queries that asks for a response
   * (2) define a view as a parepared statement
   * (3) insertion, and the relevant views that also need to be retrieved
   *     note that this is slightly different from how the workers implement it now)
   *
   * we will be using JSON here...
   */
  ws.on("message", (message: string) => {
    // log the received message and send it back to the client
    console.log("received: %s", message);
    let msg: DielMessage | undefined;
    try {
      msg = JSON.parse(message) as DielMessage;
    } catch (e) {
      console.log(`${FgRed}Message is not the expected JSON format: ${e}${Reset}`);
      return;
    }
    switch (msg.action) {
      case "open": {
        if (msg.dbName) {
          if (dbName) {
            // do nothing
            // this is the case where there are multiple sockets
            // FIXME: we can try opening multiple instances in the future
            // need to design differently
            if (dbName === msg.dbName) {
              ws.send(JSON.stringify({
                id: msg.id
              }));
              return;
            } else if (db) {
              // close
              db.close();
            }
          }
          dbName = msg.dbName;
          console.log(`Opening ${msg.dbName}`);
          const dbFile = dbFileLookup.get(msg.dbName);
          if (dbFile) {
            db = new sqlite(dbFile);
          } else {
            throw new Error(`The DB ${msg.dbName} is not defined.`);
          }
        } else {
          throw new Error(`The message ${JSON.stringify(msg)} did not define dbName.`);
        }
        ws.send(JSON.stringify({
          id: msg.id
        }));
        break;
      }
      // need better names, but in sql.js, run is without results...
      case "run": {
        if (msg.sql) {
          try {
            db.exec(msg.sql);
            ws.send(JSON.stringify({
              id: msg.id,
            }));
          } catch (e) {
            console.log(`${FgRed}Error executing to database! ${e}\nThe query was ${msg.sql}${Reset}`);
            return;
          }
        }
        break;
      }
      case "exec": {
        if (msg.sql) {
          try {
            const stmt = db.prepare(msg.sql);
            const results = stmt.all();
            // FIXME: need to know what the object even looks like here...
            console.log(JSON.stringify(results, null, 2));
            ws.send(JSON.stringify({
              id: msg.id,
              results
            }));
          } catch (e) {
            console.log(`${FgRed}Error executing to database! ${e}\nThe query was ${msg.sql}${Reset}`);
            return;
          }
        } else {
          console.log(`${FgRed}Exec actions must define the query${Reset}`);
        }
        break;
      }
      default:
        throw new Error(`Other action types are not handled!`);
    }
  });

  // FIXME: should prob use prepared statements instead...
  // https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/api.md#class-statement
  // then get all
  // const stmt = db.prepare('SELECT * FROM cats WHERE name = ?');
  // const cats = stmt.all('Joey');
  // send immediatly a feedback to the incoming connection
  ws.send("Hi there, I am a WebSocket server");
});

// start our server
server.listen(process.env.PORT || 8999, () => {
    console.log(`Server started on port ${(server.address() as WebSocket.AddressInfo).port} :)`);
});