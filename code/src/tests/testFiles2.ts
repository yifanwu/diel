import Diel from "../dist/Diel";
import { LogInfo } from "../util/messages";
export const fName = "testEnd2End";

async function main() {
  const filePath = `./src/dist/gen/${fName}.db`;
  LogInfo(`Loading generated db file, ${filePath}`);
  const d = new Diel(filePath);
  await d.Setup();
  d.BindOutput("clickValue", (v: {a: number}[]) => {console.log("clickValue clicked", JSON.stringify(v)); });
  LogInfo(`Created a new input for click`);
  d.NewInput("click", {a: 2});
  setTimeout(() => {
    console.log("waited for 3 seconds");
  }, 3000);
  LogInfo("Finished testFiles2");
  return;
}

main();