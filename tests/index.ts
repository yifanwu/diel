import { getPlainSelectQueryAst } from "../src/compiler/compiler";

const obj = getPlainSelectQueryAst("select * from t1 union select b from t2");

console.log(JSON.stringify(obj));