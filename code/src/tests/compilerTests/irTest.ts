import * as fs from "fs";

import { getIR } from "../../compiler/compiler";
import { LogStandout } from "../../lib/messages";


async function main() {
  console.log("starting tests");
  // ["tests", "testsComplex", "testEnd2End",
  //  "testOperators", "testXFilter", "testTemplate",
  //  "testTmp", "testsConstraint"]

  const r = ["tests"].map(fn => {
    const tests = fs.readFileSync(`./src/tests/testPrograms/${fn}.sql`, "utf8").split(/-- TEST: \w+\n/);
    tests.filter(t => t.length > 0).map(t => {
      LogStandout(`Running\n${t}`);
      let ir = getIR(t);
      console.log(`Generated IR:\n${JSON.stringify(ir, null, 2)}\n`);
    });
  });
  Promise.all(r).then(() => true);
}

main();