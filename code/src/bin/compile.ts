#!/usr/bin/env node

import * as commander from "commander";
import * as glob from "glob";
import * as path from "path";

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { LogWarning, LogInfo, ReportDielUserError } from "../util/messages";
import { getIR } from "../compiler/compiler";
import { genFiles } from "../compiler/fileGen";

// read file dielconfig.json's src for files to read from
const configFile = "dielconfig.json";

function compileFromJSON(inputFilePath: string) {
  const configPath = inputFilePath ? resolve(process.cwd(), inputFilePath + "/" + configFile) : resolve(process.cwd(), configFile);
  // fixme: add config typings
  let config: any;
  try {
    console.log("Reading", configPath);
    const configRaw = readFileSync(configPath, "utf8");
    config = JSON.parse(configRaw);
  } catch {
    (`${configFile} is not defined or ill formatted`);
  }
  if (!config.hasOwnProperty("src")) {
    ReportDielUserError("Config must include `src` property");
    return;
  }
  if (!config.hasOwnProperty("dist")) {
    ReportDielUserError("Config must include `dist` property");
    return;
  }
  let diel = "";
  glob(config.src, (err, files) => {
    if (err) {
      LogWarning(`${configFile} error: ${err}`);
    }
    console.log("your files", JSON.stringify(files));
    files.forEach(file => {
      diel += "\n";
      diel += readFileSync(file);
    });
    LogInfo(`Now compiling\n${diel}`);
    // dump this to a file
    writeFileSync(path.join(config.dist, `inputDielStmt.sql`), diel);
    const ir = getIR(diel);
    genFiles(ir, config.dist);
  });
}

commander
  .version("1.0.0")
  .description("DIEL compiler");

commander
  .command("compile")
  .alias("c")
  .option("-p [path]")
  .description("compile diel code")
  .action(compileFromJSON);

const dielHelp = () => {
  console.log(`
In the directory that contains the file dielconfig.json, e.g. {
  "src": "./src/diel/*.sql"
}
run
> diel-cli compile
  `);
};
commander.on("--help", dielHelp);

commander.parse(process.argv);