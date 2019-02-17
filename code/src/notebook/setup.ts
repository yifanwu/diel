import DielRuntime from "../runtime/DielRuntime";

const dielFiles = ["./src/notebook/tests/simple.diel"];
const mainDbPath = "./UI-dist/test.db";

export const runtime = new DielRuntime({
  dielFiles,
  mainDbPath
});