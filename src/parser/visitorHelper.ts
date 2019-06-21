import { DielDataType } from "./dielAstTypes";
import { Interval } from "antlr4ts/misc";

export function parseColumnType(str: string) {
  switch (str.toLowerCase()) {
    case "number":
    case "integer":
    case "int":
    case "real":
      return DielDataType.Number;
    case "string":
    case "text":
      return DielDataType.String;
    case "boolean":
      return DielDataType.Boolean;
    case "datetime":
      return DielDataType.TimeStamp;
    default:
      throw new Error(`parseColumnType error, got ${str}`);
  }
}

export function getCtxSourceCode(ctx: any): string {
  if (ctx) {
    let a = ctx.start.startIndex;
    let b = ctx.stop.stopIndex;
    let interval = new Interval(a, b);
    return ctx.start.inputStream.getText(interval);
  }
  return "";
}
