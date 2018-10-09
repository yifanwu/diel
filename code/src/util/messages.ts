import { STRICT } from "../compiler/config";

export const FgRed = "\x1b[31m"
export const FgBlue = "\x1b[34m";
export const Reset = "\x1b[0m";
export const BgRed = "\x1b[41m"
export const BgGreen = "\x1b[42m"
export const BgYellow = "\x1b[43m"

export function LogError(m: string) {
  console.log(`${FgRed}%s${Reset}`, m);
  if (STRICT) {
    throw new Error();
  }
}

export function LogInfo(m: string) {
  console.log(`${FgBlue}%s${Reset}`, m);
}

export function LogStandout(m: string) {
  console.log(`${BgYellow}%s${Reset}`, m);
}