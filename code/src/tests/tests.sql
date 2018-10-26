-- TEST: eval
create view v2 as
  select fun(a + 1, b) + fun2(c) + 3 * 4
  from t2;

-- TEST: table
create table t1 as
  select 1 as a, 2 as b, 3 as c
  union select 1, 3, 4
  union select 2, 3, 4;

-- TEST: input
CREATE INPUT click (a number, b string);

-- TEST: output
CREATE OUTPUT clickValue AS select a from click;

-- TEST: programs
CREATE INPUT click (a number, b string);
CREATE PROGRAM
BEGIN
  INSERT INTO RANDOM2 (A, b, c) VALUES (132);
  INSERT INTO RANDOM (A, b) VALUES ('a', 'b');
  insert into clickSp (a) select a from click;
END;

-- TEST: complex
create input navigateItx (low number, high number);
create output lastNavigate as
  select *
  from navigateItx
  where itxId = (
    SELECT MAX(itxId) AS itxId
    FROM navigateItx
  );