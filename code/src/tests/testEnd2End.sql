CREATE INPUT click (a number);
CREATE INPUT click2 (b string);
CREATE OUTPUT clickValue AS select a from click;
CREATE TABLE clickSp (aPrime number);

CREATE PROGRAM AFTER click
  BEGIN
    INSERT INTO clickSp (aPrime) select a * 2 from click;
  END;