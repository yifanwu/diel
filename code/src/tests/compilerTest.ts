import { genSql } from "../compiler/codeGenSql";
import { genTs } from "../compiler/codeGenTs";
import { getIR, genFiles } from "../compiler/compiler";
// async
function testQuery(q: string) {
  const ir = getIR(q);
  console.log(`Generated IR: ${JSON.stringify(ir, null, 2)}\n`);
  console.log(`Generated query: ${genTs(ir)}`);
  console.log(`Generated query: ${genSql(ir)}`);
  genFiles(ir);
  return;
}

// const inputQ = `CREATE INPUT click (a number, b string);`;
const outputQ = `CREATE OUTPUT clickValue AS select a from click;`;

function main() {
  console.log("starting tests");
  // testQuery(inputQ);
  testQuery(outputQ);
}

main()