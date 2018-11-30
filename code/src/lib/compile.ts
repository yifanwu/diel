#!/usr/bin/env node

import * as commander from "commander";
import * as glob from "glob";
import * as path from "path";
import * as fs from "fs";

import { resolve } from "path";
import { LogWarning, LogInfo, ReportDielUserError } from "./messages";
import { getDielAst } from "../compiler/compiler";
import { genFiles } from "../compiler/fileGen";

// read file dielconfig.json's src for files to read from
const configFile = "dielconfig.json";

function compileFromJSON(inputFilePath: string) {
  const configPath = inputFilePath ? resolve(process.cwd(), inputFilePath + "/" + configFile) : resolve(process.cwd(), configFile);
  // fixme: add config typings
  let config: any;
  try {
    LogInfo(`Reading configuration file: ${configPath}`);
    const configRaw = fs.readFileSync(configPath, "utf8");
    config = JSON.parse(configRaw);
  } catch {
    (`${configFile} is not defined or ill formatted`);
  }
  if (!config) {
    ReportDielUserError(`Cannot find config file at ${configFile}`);
    return;
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
    LogInfo(`DIEL is processing the following files:${files.join("\n")}\n`);
    files.forEach(file => {
      diel += "\n";
      diel += fs.readFileSync(file);
    });
    LogInfo(`Now compiling\n${diel}`);
    // check if the destination exists
    if (!fs.existsSync(config.dist)) {
      try {
        fs.mkdirSync(config.dist);
      } catch (e) {
        ReportDielUserError(`The output directory, ${config.dist}, in dielconfig.json is not specified. Please fix it before running again.`);
      }
    }
    // dump this to a file
    fs.writeFileSync(path.join(config.dist, `inputDielStmt.sql`), diel);
    const ir = getDielAst(diel);
    genFiles(ir, config.dist);
  });
}

commander
  .version("1.0.0")
  .description("DIEL compiler")
  .usage("optional -p flag for relative path from package.json dir")
  .option("-p, --path [value]")
  .parse(process.argv);

compileFromJSON(commander.path);

// const dielHelp = () => {
//   console.log(`
// In the directory that contains the file dielconfig.json, e.g. {
//   "src": "./src/diel/*.sql"
// }
// run
// > diel-cli compile
//   `);
// };
// commander.on("--help", dielHelp);