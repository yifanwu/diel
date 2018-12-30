import { getDielIr } from "../../compiler/compiler";
import { LogStandout } from "../../lib/messages";

const primaryKey = `CREATE TABLE t1 (
  itxId INTEGER PRIMARY KEY
);`;

const notNull = `
CREATE TABLE t2 (
  ts INTEGER NOT NULL,
  chart TEXT NOT NULL
);`;

const simpleUnique = `
CREATE TABLE t3 (
  ts INTEGER UNIQUE
);`;

const unique = `
CREATE TABLE t4 (
  ts INTEGER NOT NULL,
  chart TEXT NOT NULL,
  UNIQUE(ts, chart)
);`;

const check = `
CREATE TABLE t5 (
  chart TEXT,
  CHECK (chart = 'a' or chart = 'b')
);`;