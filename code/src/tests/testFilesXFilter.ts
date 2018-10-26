import Diel from "../dist/Diel";
import { LogInfo } from "../util/messages";

export const fName = "testXFilterSimple";

async function main() {
  const filePath = `./src/dist/gen/${fName}.db`;
  LogInfo(`Loading generated db file, ${filePath}`);
  const d = new Diel(filePath);
  await d.Setup();
  console.log("cAUnfiltered", JSON.stringify(d.GetStaticView("cAUnfiltered"), null, 2));
  d.BindOutput("cAFiltered", (v: any) => {console.log("cAFiltered", JSON.stringify(v, null, 2)); });
  d.BindOutput("cBFiltered", (v: any) => {console.log("cBFiltered", JSON.stringify(v, null, 2)); });
  d.BindOutput("cCFiltered", (v: any) => {console.log("cCFiltered", JSON.stringify(v, null, 2)); });
  LogInfo(`Created a new itx`);
  d.NewInput("itx", {chart: "b", low: 0, high: 2});
  LogInfo("Finished testFiles2");
  return;
}

main();