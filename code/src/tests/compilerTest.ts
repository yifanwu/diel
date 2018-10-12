import * as fs from "fs";

import { genSql } from "../compiler/codeGenSql";
import { genTs } from "../compiler/codeGenTs";
import { getIR, genFiles } from "../compiler/compiler";
import { LogStandout } from "../util/messages";

function testQuery(q: string) {
  const ir = getIR(q);
  console.log(`Generated IR:\n${JSON.stringify(ir, null, 2)}\n`);
  console.log(`Generated query:\n${genTs(ir)}`);
  console.log(`Generated query:\n${genSql(ir).join("\n\n")}`);
  // genFiles(ir);
  return;
}

function main() {
  console.log("starting tests");
  const tests = fs.readFileSync("./src/tests/tests.sql", "utf8").split(/-- TEST: \w+\n/);
  tests.filter(t => t.length > 0).map(t => {
    LogStandout(`Running\n${t}`);
    // console.log(`Testing: ${t.match(/-- TEST: \w+ /ig)[0].slice(9)}`);
    testQuery(t);
  });
}

main();