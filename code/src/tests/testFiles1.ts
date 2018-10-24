
import * as fs from "fs";
import { getIR } from "../compiler/compiler";
import { genFiles } from "../compiler/fileGen";
import { LogInfo } from "../util/messages";

// all the tests are hardcoded against this file
export const fName = "testEnd2End";

async function main() {
  const code = fs.readFileSync(`./src/tests/${fName}.sql`, "utf8");
  const ir = getIR(code, {name: fName});
  genFiles(ir);
  LogInfo(`Done generating Files!`);
}

main();