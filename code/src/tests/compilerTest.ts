import * as fs from "fs";

// import { genSql } from "../compiler/codeGenSql";
import { genTs } from "../compiler/codeGenTs";
import { getIR } from "../compiler/compiler";
import { LogStandout } from "../lib/messages";
// import { sanityIr } from "../compiler/errorChecking";
import { genFiles } from "../compiler/fileGen";

async function testQuery(q: string, createFile: boolean) {
  let ir = getIR(q);
  console.log(`Generated IR:\n${JSON.stringify(ir, null, 2)}\n`);
  // modify IR based on crossfiler
  // console.log(`Sanity checking:\n${sanityIr(ir)}`);
  // console.log(`Generated TS:\n${genTs(ir)}`);
  const doc = await genTs(ir);
  fs.writeFileSync("tmp.ts", doc);
  // console.log(`Generated SQL:\n${genSql(ir).join("\n\n")}`);
  if (createFile) {
    // TODO: maybe clean some files out before running each tme
    genFiles(ir, "compiled/");
  }
  return;
}

async function main() {
  console.log("starting tests");
  // ["tests", "testsComplex", "testEnd2End",
  //  "testOperators", "testXFilter", "testTemplate",
  //  "testTmp", "testsConstraint"].map(fn => {

  const r = ["testEnd2End"].map(fn => {
    const tests = fs.readFileSync(`./src/tests/${fn}.sql`, "utf8").split(/-- TEST: \w+\n/);
    tests.filter(t => t.length > 0).map(t => {
      LogStandout(`Running\n${t}`);
      testQuery(t, false);
    });
  });
  Promise.all(r).then(() => true);
}

main();