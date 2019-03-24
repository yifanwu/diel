export const not_null1 = `
  create view filtered_view as select a1, a2 from t1 where a1 > 10
  constrain a1 NOT NULL;
  `;
export const not_null2 =
`
create view filtered_view as select a1, a2 from t1 where a1 > 10
constrain a1 NOT NULL, a2 NOT NULL;
`;