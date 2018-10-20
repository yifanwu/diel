// generate a meaninful complain
import { LogInternalError } from "../util/messages";

export function dielIrComplain(reason: string) {
  LogInternalError(reason);
}