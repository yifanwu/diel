CREATE INPUT click (a number, b string);
CREATE OUTPUT clickValue AS select a from click;
create table clickSp (a number);
CREATE PROGRAM AFTER click
BEGIN
  INSERT INTO clickSp (a) select a from click;
END;