
import * as fs from "fs";
import { getIR } from "../compiler/compiler";
import { genFiles } from "../compiler/fileGen";
import { LogInfo } from "../util/messages";

// all the tests are hardcoded against this file

async function main() {
  // console.log("args", process.argv);
  // const fName = process.argv[2];
  const fName = "testXFilterSimple";
  LogInfo(`Setting up for ${fName}`);
  const code = fs.readFileSync(`./src/tests/${fName}.sql`, "utf8");
  const ir = getIR(code, {name: fName});
  console.log(`Generated IR\n${JSON.stringify(ir, null, 2)}`);
  genFiles(ir);
  LogInfo(`Done generating Files!`);
}

main();