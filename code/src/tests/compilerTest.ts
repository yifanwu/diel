import * as fs from "fs";

import { genSql, generateCrossFilterSql } from "../compiler/codeGenSql";
import { genTs } from "../compiler/codeGenTs";
import { getIR } from "../compiler/compiler";
import { LogStandout } from "../util/messages";
import { sanityIr } from "../compiler/errorChecking";

function testQuery(q: string) {
  const ir = getIR(q);
  console.log(`Generated IR:\n${JSON.stringify(ir, null, 2)}\n`);
  console.log(`Sanity checking:\n${sanityIr(ir)}`);
  console.log(`Generated TS:\n${genTs(ir)}`);
  console.log(`Generated SQL:\n${genSql(ir).join("\n\n")}`);
  const crossfilter = generateCrossFilterSql(ir);
  console.log(crossfilter ? `Generated Crossfilter SQL:\n${crossfilter.join("\n\n")}` : null);
  return;
}

function main() {
  console.log("starting tests");
  // ["tests", "testsComplex", "testEnd2End", "testOperators", "testXFilter"].map(fn => {
  ["testTemplate"].map(fn => {
    const tests = fs.readFileSync(`./src/tests/${fn}.sql`, "utf8").split(/-- TEST: \w+\n/);
    tests.filter(t => t.length > 0).map(t => {
      LogStandout(`Running\n${t}`);
      testQuery(t);
    });
  });
}

main();