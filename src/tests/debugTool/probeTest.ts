import { getDielIr } from "../../compiler/compiler";

// this is a helper for looking at the IR.

const query = `
  create DYNAMIC table t1 (a int, b int);
  create DYNAMIC table t2 (c int, b int);
  create view v1 as select a, c from t1 join (select b from t2) as t on t1.b = t.b where t1.a > 1;
`;

function main() {
  const ir = getDielIr(query);
  console.log(JSON.stringify(ir, null, 2));
}

main();