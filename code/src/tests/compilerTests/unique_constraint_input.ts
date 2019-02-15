export const unique1 =
`create view filtered_view as select a1, a2, a3 from t1 where a1 < 10
constrain UNIQUE (a1, a2);
`;

export const unique2 =
`create view filtered_view as select a1, a2, a3 from t1 where a1 < 10
constrain UNIQUE (a1, a2), UNIQUE (a3);
`;
