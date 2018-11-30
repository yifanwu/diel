import { getDielAst } from "../../compiler/compiler";

// this is a helper for looking at the IR.

const query = `
  create DYNAMIC table t (a int, b int);
  create view v1 as select a, b+1 from t;
`;

function main() {
  const ir = getDielAst(query);
  console.log(JSON.stringify(ir, null, 2));
}

main();