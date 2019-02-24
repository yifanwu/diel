import * as Fuse from "fuse.js";
import { GenerateUnitTestErrorLogger } from "../lib/messages";
import { getDielIr } from "../lib/cli-compiler";
import { ExprColumnAst } from "../parser/exprAstTypes";
import { func } from "prop-types";
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

export function searchNames() {
    let q = `
    create input department (
        dname text,
        dID int
    );
    create input employment (
        ename text,
        eID int,
        dID int
    );

    `;
    const logger = GenerateUnitTestErrorLogger("searchNames", q);
    let ir = getDielIr(q);
    // console.log(ir);
    var list = new Array();
    var colNames, names;
    ir.allOriginalRelations.forEach(function(value, key, map): string {
            colNames = [] as string[];
            value.columns.map(function(property) {
                colNames.push(property.name);
            });
            names = {
                tableName: key,
                colNames: colNames
            };
            if (list.indexOf(names) === -1) {
                // does not exist
                list.push(names);
            }
            return key;
    });
    search(list);
}

function search(ls: Array<any>) {
    var tableoptions = {
        shouldSort: true,
        threshold: 0.5,
        location: 0,
        maxPatternLength: 100,
        minMatchCharLength: 1,
        keys: [
          "tableName",
        ]
      } as any;
      var colOptions = {
        shouldSort: true,
        threshold: 0,
        location: 0,
        maxPatternLength: 100,
        minMatchCharLength: 2,
        keys: [
          "colNames",
        ]
      } as any;

      console.log(ls);
        rl.question("Table keyword: ", (tableKey: string) => {
            // TODO: Log the answer in a database
            var fuse = new Fuse(ls, tableoptions); // "list" is the item array
            var result = fuse.search(tableKey);
            console.log(result);
            rl.question("Column keyword:", (colKey: string) => {
                fuse = new Fuse(ls, colOptions); // "list" is the item array
                result = fuse.search(colKey);
                console.log(result);
                rl.close();
            });
            return;
            });

}

searchNames();

