export const check1 = `create view filtered_view as select a1, a2 from t1 where a1 < 10
constrain CHECK (a1 < 5);`;

export const check2 = `create view filtered_view as select a1, a2 from t1 where a1 < 10
constrain CHECK (a1 < 5), CHECK (a2 < 10);`;

export const check3 = `create view filtered_view as select a1, a2 from t1 where a1 < 10
constrain CHECK (a1 < 5 and a2 < 10);`;