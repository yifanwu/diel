import { QueryResults, Database, Statement } from "sql.js";
import { log } from "./dielUdfs";
import { LogInfo } from "./messages";

export type OutputBoundFunc = (v: any) => any;

export function DeepCopy<T>(o: T): T {
  return JSON.parse(JSON.stringify(o));
}

export function SetSymmetricDifference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  let _difference = new Set(setA);
  for (let elem of setB) {
    if (_difference.has(elem)) {
        _difference.delete(elem);
    } else {
        _difference.add(elem);
    }
  }
  return _difference;
}

export function SetDifference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  let _difference = new Set(setA);
  for (let elem of setB) {
    _difference.delete(elem);
  }
  return _difference;
}

export function SetUnion<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  let _union = new Set(setA);
  for (let elem of setB) {
    _union.add(elem);
  }
  return _union;
}

export function SetIntersection<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  let _intersection = new Set();
  for (let elem of setB) {
    if (setA.has(elem)) {
        _intersection.add(elem);
    }
  }
  return _intersection;
}

export async function loadDbHelper(db: Database, file: string, tick: () => () => void) {
  if (db) {
    db.close();
  }
  let buffer;
  const response = await fetch(file);
  const bufferRaw = await response.arrayBuffer();
  buffer = new Uint8Array(bufferRaw);
  db = new Database(buffer);
  // db.create_function("timeNow", timeNow);
  db.create_function("log", log);
  db.create_function("tick", tick());
  LogInfo(`DIEL Loaded DB Successfully`);
}

// console tools
export function d(db: Database, sql: string) {
  let r = db.exec(sql);
  if (r.length > 0) {
    r[0].values.map((v) => {
      v.map((c, i) => {
        if (r[0].columns[i] === "ts") {
          c = new Date(c as number).toDateString();
        }
      });
    });
    console.log(r[0].columns.join("\t"));
    console.log(JSON.stringify(r[0].values).replace(/\],\[/g, "\n").replace("[[", "").replace("]]", "").replace(/,/g, "\t"));
  } else {
    console.log("NO RESULT");
  }
}
if (typeof window !== "undefined" && window) (<any>window).d = d;
// debug assertions

export function assertQueryHasResult(r: QueryResults, query?: string) {
  if ((!r) || (!r.values)) {
    throw new Error(`Query ${query} has NO result`);
  }
}

// this is needed because the groupby has non deterministic orderings
// and I wasn't able to write a custom reducer
// I suspect this is faster anyways
export function hashCompare(a: string, b: string): number {
  // split by -
  const aVals = a.split("-");
  const bVals = b.split("-");
  for (let i = 0; i < aVals.length; i++) {
    const av = aVals[i];
    const table = av.split(":")[0];
    const bR = bVals.filter(bv => bv.split(":")[0] === table);
    if (bR.length !== 1) {
      console.log("didn't find", table, bVals);
      return 0;
    }
    if (bR[0] !== av) {
      return 0;
    }
  }
  return 1;
}

/**********************
 * download support
 *********************/

function prettyTimeNow() {
  return new Date().toTimeString().substr(0, 8);
}

export function downloadHelper(blob: Blob, name: string, extension = "db") {
  if (typeof window !== "undefined" && window) {
    let a = document.createElement("a");
    a.href = window.URL.createObjectURL(blob);
    a.download = `${name}_${prettyTimeNow()}.${extension}`;
    a.onclick = function() {
      setTimeout(function() {
        window.URL.revokeObjectURL(a.href);
      }, 1500);
    };
    a.click();
  } else {
    console.log("Not in web environment!");
  }
}


export function downloadQueryResultAsCSV(db: Database, query: string) {
  let csvContent = "";
  let r = db.exec(query);
  if (r.length && r[0].values) {
    csvContent += r[0].columns.join(",") + "\r\n";
    r[0].values.forEach((rowArray) => {
      let row = rowArray.join(",");
      csvContent += row + "\r\n";
    });
    let b = new Blob([csvContent], {type: "text/plain;charset=UTF-8"});
    downloadHelper(b, "userData.csv");
    console.log("should have downloaded", csvContent);
  } else {
    console.log("NO RESULT");
  }
}