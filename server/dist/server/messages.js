"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FgRed = "\x1b[31m";
const FgBlue = "\x1b[34m";
const Reset = "\x1b[0m";
function LogWarning(m) {
    console.log(`${FgRed}%s${Reset}`, m);
}
exports.LogWarning = LogWarning;
function LogInfo(m) {
    console.log(`${FgBlue}%s${Reset}`, m);
}
exports.LogInfo = LogInfo;
//# sourceMappingURL=messages.js.map