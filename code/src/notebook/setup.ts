import DielRuntime from "../runtime/DielRuntime";

const dielFiles = ["./src/notebook/tests/simple.diel"];
const mainDbPath = "./UI-dist/test.db";

export const diel = new DielRuntime({
  dielFiles,
  mainDbPath
});