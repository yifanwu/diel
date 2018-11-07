// generate a meaninful complain
import { LogInternalError } from "../lib/messages";

export function dielIrComplain(reason: string) {
  LogInternalError(reason);
}