
import { LogInternalError, ReportDielUserError } from "../../lib/messages";

// let's classify types of errors...
export enum ErrorTypes {
  MissingType = "MissingType",
  ExpectingSemiColon = "ExpectingSemiColon"
}
// This file contains a mini database of usefule errors and their situations.
// TODO:

export function dielIrComplain(reason: string) {
  LogInternalError(reason);
}