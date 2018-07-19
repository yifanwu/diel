import { Interval } from "antlr4ts/misc";
export function getCtxSourceCode(ctx: any) {
  let a = ctx.start.startIndex;
  let b = ctx.stop.stopIndex;
  let interval = new Interval(a,b);
  return ctx.start.inputStream.getText(interval);
};
