-- TEST: simplePrimary
CREATE TABLE t1 (
  itxId INTEGER PRIMARY KEY
);

-- TEST: simpleNull
CREATE TABLE t2 (
  ts INTEGER NOT NULL,
  chart TEXT NOT NULL
);

-- TEST: simpleUnique
CREATE TABLE t3 (
  ts INTEGER UNIQUE
);

-- TEST: unique
CREATE TABLE t4 (
  ts INTEGER NOT NULL,
  chart TEXT NOT NULL,
  UNIQUE(ts, chart)
);

-- TEST: check
CREATE TABLE t5 (
  chart TEXT,
  CHECK (chart = 'a' or chart = 'b')
);