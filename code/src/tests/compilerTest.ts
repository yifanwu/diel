import { genSql } from "../compiler/codeGenSql";
import { compileDiel } from "../compiler/compiler";

const FgBlue = "\x1b[34m";
const Reset = "\x1b[0m";

function testQuery(q: string) {
  console.log(`${FgBlue}%s${Reset}`, `\nCompiling query: ${q}`);
  const ir = compileDiel(q);
  console.log(`Generated IR: ${JSON.stringify(ir, null, 2)}\n`);
  console.log(`Generated query: ${genSql(ir)}`);
}

const inputQ = `CREATE INPUT click (a number, b string);`;
const outputQ = `CREATE OUTPUT clickValue AS select a from click;`;

testQuery(inputQ);
testQuery(outputQ);