import * as fs from "fs";

import { genSql } from "../compiler/codeGenSql";
import { genTs } from "../compiler/codeGenTs";
import { getIR } from "../compiler/compiler";
import { LogStandout } from "../util/messages";
import { sanityIr } from "../compiler/errorChecking";

function testQuery(q: string) {
  const ir = getIR(q);
  console.log(`Generated IR:\n${JSON.stringify(ir, null, 2)}\n`);
  console.log(`Sanity checking:\n${sanityIr(ir)}`);
  console.log(`Generated query:\n${genTs(ir)}`);
  console.log(`Generated query:\n${genSql(ir).join("\n\n")}`);
  return;
}

function main() {
  console.log("starting tests");
  // "tests", "testsComplex", "testEnd2End"
  ["testsComplex"].map(fn => {
    const tests = fs.readFileSync(`./src/tests/${fn}.sql`, "utf8").split(/-- TEST: \w+\n/);
    tests.filter(t => t.length > 0).map(t => {
      LogStandout(`Running\n${t}`);
      testQuery(t);
    });
  });
}

main();