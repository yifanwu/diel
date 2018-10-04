import { Interval } from "antlr4ts/misc";

import { Column, DataType } from "../parser/dielTypes";


export function parseColumnType(str: string) {
  switch (str.toLowerCase()) {
    case "number":
      return DataType.Number;
    case "string":
      return DataType.String;
    case "boolean":
      return DataType.Boolean;
    default:
      throw new Error("Parsing error");
  }
}
export function getCtxSourceCode(ctx: any) {
  let a = ctx.start.startIndex;
  let b = ctx.stop.stopIndex;
  let interval = new Interval(a,b);
  return ctx.start.inputStream.getText(interval);
};

export function columnStr(cols: Column) {
  let postfix = null;
  if (cols.type === DataType.Number) {
    postfix = "REAL";
  } else if (cols.type === DataType.String) {
    postfix = "TEXT";
  } else if (cols.type === DataType.Boolean) {
    postfix = `INTEGER check (${cols.name} = 0 or ${cols.name} = 1)`;
  }
  return `${cols.name} ${postfix}`;
}