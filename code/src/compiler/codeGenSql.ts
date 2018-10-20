import { DielIr, RelationIr, ProgramsIr, ProgramSpecIr } from "../parser/dielTypes";
import { columnStr } from "./helper";
import * as fs from "fs";

// then there will another pass where we do the networking logic.
// export function setupNetworking(ir: DielIr) {
// }

function triggerGeneric(program: ProgramSpecIr) {
  return `
create trigger allInputsTrigger after insert on allInputs
  begin
    select tick();
    ${program.selectPrograms.map(insert => insert.query).join("\n")}
    ${program.insertPrograms.map(insert => insert.query).join("\n")}
  end;`
}

/**
 * simple case: latest X -> select * from X where timestep = select max(timestep) from X
 * filter case: latest X where P -> AND P
 */
// function transpileLatest() {
// }

function triggerTemplate(ir: DielIr) {
  let triggers = ir.inputs.map(i => {
    // also need to get the individual programs
    const matchingTrigger = ir.programs.filter(p => p.input === i.name);
    let programs = "";
    if (matchingTrigger.length > 0) {
      programs += matchingTrigger[0].insertPrograms.map(insert => insert.query).join("\n");
      programs += matchingTrigger[0].selectPrograms.map(insert => insert.query).join("\n");
    }
    return `
create trigger ${i.name}Trigger after insert on ${i.name}
begin
  insert into allInputs (timestep) values (null);
  ${programs}
end;
      `;
  });
  return triggers;
}

export function genSql(ir: DielIr) {
  const inputQueries = ir.inputs.map(r => `
    insert into ${r.name} (timestep, ${r.columns.map(c => c.name).join(", ")})
    select max(timestep), ${r.columns.map(c => c.name).map(v => `$${v}`).join(", ")}
    from allInputs;
    `);
  const outputQueries = ir.outputs.map(r => `
    create view ${r.name} as ${r.query};
  `);
  const specificTriggers = triggerTemplate(ir);
  const genericProgram = ir.programs.filter(p => (p.input) ? false : true);
  let genericTrigger = null;
  if (genericProgram.length > 0) {
    genericTrigger = triggerGeneric(genericProgram[0]);
  }
  const staticQueries = fs.readFileSync("./src/compiler/static.sql", "utf8");
  return [staticQueries, genericTrigger, ...inputQueries, ...outputQueries, ...specificTriggers];
}
