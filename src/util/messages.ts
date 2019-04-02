import { STRICT } from "../runtime/DielRuntime";

export const FgRed = "\x1b[31m";
export const FgBlue = "\x1b[34m";
export const Reset = "\x1b[0m";
export const BgRed = "\x1b[41m";
export const BgGreen = "\x1b[42m";
export const BgYellow = "\x1b[43m";

export const QueryConsoleColorSpec = "color: green";

export enum DielInternalErrorType {
  Untitled = "Untitled",
  ArgNull = "ArgNull",
  TypeError = "TypeError",
  RelationNotFound = "RelationNotFound",
  NotImplemented = "NotImplemented",
  UnionTypeNotAllHandled = "UnionTypeNotAllHandled",
  MalFormedAst = "MalFormedAst"
}

export enum DielInternalWarningType {
  Untitled = "Untitled",
  ArgNull = "ArgNull"
}

export function LogInternalError(m: string, errorType = DielInternalErrorType.Untitled) {
  if (typeof window === "undefined") {
    console.log(`${FgRed}%s${Reset}`, m);
  } else {
    debugger;
    console.log(`%cError[${errorType}]: ${m}`, "color: red");
  }
  if (STRICT) throw new Error();
}

export function LogInternalWarning(m: string, wariningType = DielInternalWarningType.Untitled) {
  if (typeof window === "undefined") {
    console.log(`${FgRed}%s${Reset}`, m);
  } else {
    console.log(`%cWarning[${wariningType}]: ${m}`, "color: orange");
  }
}

export function LogInfo(m: string, obj?: any) {
  console.log(`${FgBlue}%s${Reset}`, m, obj);
}

export function LogTmp(m: string) {
  console.log(`%c ${m}`, "color: gray");
}

export function LogStandout(m: string) {
  console.log(`${BgYellow}%s${Reset}`, m);
}

export function ReportDielBasicParsingError(m: string) {
  console.log(`${FgRed}Parsing error from user provided code:\n%s${Reset}`, m);
  if (STRICT) throw new Error();
}

export function ReportUserRuntimeWarning(m: string) {
  console.log(`%cUser runtime warning: ${m}`, "color: orange");
}

// note that this is in browser
export function ReportUserRuntimeError(m: string) {
  if (STRICT) throw new Error(m);
  console.log(`%c Runtime error from user specification: ${m}`, "color: red");
}

// both warning and error
export enum UserErrorType {
  UndefinedScale = "UndefinedScale",
}

// TODO: this should also report the line of the code
// the input should be more structured
export function ReportDielUserError(m: string, q?: string, errorType?: UserErrorType) {
  if (typeof window === "undefined") {
    console.log(`${FgRed}%s${Reset}`, m);
  } else {
    debugger;
    console.log(`%cUser Error[${errorType}]: ${m}${q ? `\nFor query ${q}` : ""}`, "color: red");
  }
  if (STRICT) {
    throw new Error();
  }
}

export function ReportDielUserWarning(m: string, q?: string) {
  console.log(`User Warning: ${BgGreen}%s${Reset}`, m);
  if (q) console.log(`\nQuery: ${FgBlue}%s${Reset}\n`, q);
}


export function GenerateUnitTestErrorLogger(testName: string, q: string) {
  console.log(`${BgYellow}Starting Test: %s${Reset}\nWith query:\n%s`, testName, q);
  return (m: string) => {
    console.log(`\nError for ${testName}: ${FgRed}%s${Reset}`, m);
    throw new Error(`Unit test ${testName} failed\n`);
  };
}

export function sanityAssert(b: boolean, msg: string) {
  if (!b) {
    LogInternalError(`Assertion error: ${msg}`);
  }
}