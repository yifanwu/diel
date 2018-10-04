import { DielIr, InputIr } from "../parser/dielTypes";

function overallTemplate(inputCode: string) {
  return `
import { Database, Statement } from "sql.js";
export default class Diel {
  ${inputCode}
};
  `
}

function getInputTypeFromName(inputName: string) {
  return `${inputName}Type`;
}

function createInputTs(qs: InputIr[]) {
  // first need to create the public view so that it can be seen
  // then need to create the statements
  const inputTypes = qs.map(q => `
     ${q.name}: (i: ${getInputTypeFromName(q.name)} => void);
  `);
  return `
  Input: {
    ${inputTypes}
  }
  `;
}

// TODO
export function genTs(ir: DielIr) {
  const inputCode = createInputTs(ir.inputs);
  const file = overallTemplate(inputCode);
  return file;
}