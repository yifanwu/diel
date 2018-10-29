#!/usr/bin/env node

import * as commander from "commander";
import * as glob from "glob";

import { readFileSync } from "fs";
import { resolve } from "path";
import { LogWarning, LogInfo } from "../util/messages";
import { getIR } from "../compiler/compiler";

// read file dielconfig.json's src for files to read from
const configFile = "dielconfig.json";

console.log("we are running the compile file");
console.log("your current dir", __dirname);
console.log("trying to read", resolve(__dirname, configFile));

function compileFromJSON() {
  console.log(`DIEL compiling files speicfied in ${configFile}`);
  // fixme: add config typings
  let config: any;
  try {
    const configRaw = readFileSync(resolve(__dirname, configFile), "utf8");
    // fs.readdirSync(`./${configFile}`);
    config = JSON.parse(configRaw);
  } catch {
    LogWarning(`${configFile} is not defined or ill formatted`);
  }
  // now load in all the files, concat into one large file
  // deal with recursive stuff later
  let diel = "";
  glob(config.src, (err, files) => {
    if (err) {
      LogWarning(`${configFile} error: ${err}`);
    }
    console.log("your files", JSON.stringify(files));
    files.forEach(file => {
      diel += readFileSync(file);
    });
    LogInfo(`Now compiling\n${diel}`);
    getIR(diel);
  });
}

commander
 .version("1.0.0")
 .description("DIEL compiler")
 .command("compile")
 .alias("a")
 .description("compile diel code")
 .action(compileFromJSON);

commander.on("--help", function() {
  console.log("");
  console.log("Examples:");
  console.log("  $ custom-help --help");
  console.log("  $ custom-help -h");
});

commander.parse(process.argv);