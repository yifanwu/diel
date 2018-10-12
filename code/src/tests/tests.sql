-- TEST: input
CREATE INPUT click (a number, b string);

-- TEST: output
CREATE OUTPUT clickValue AS select a from click;

-- TEST: programs
CREATE INPUT click (a number, b string);
CREATE PROGRAM
BEGIN
  INSERT INTO RANDOM2 (A, b, c) VALUES (132)
  INSERT INTO RANDOM (A, b) VALUES ('a', 'b')
  insert into clickSp (a) select a from click
END;
