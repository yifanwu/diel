import { ANTLRInputStream, CommonTokenStream } from "antlr4ts";
import * as parser from "../parser/grammar/DIELParser";
import * as lexer from "../parser/grammar/DIELLexer";
import Visitor from "../parser/generateIr";
import { DielIr, ProgramSpecIr } from "../parser/dielTypes";
import * as fs from "fs";
import { LogInfo } from "../util/messages";

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
  end;`;
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

export function modifyIrFromCrossfilter(ir: DielIr) {
  // filtered & unfiltered
  // register filtered to output
  // returning arrays of arrays, should be flattened for execution
  ir.crossfilters.map(i => {
    return i.charts.map(c => {
      const viewQuery = `create view ${c.chartName}Unfiltered as ${c.definition};`;
      const viewIr = _getViewIr(viewQuery, ir);
      ir.views.push(viewIr);
      const otherCharts = i.charts.filter(c2 => c2.chartName !== c.chartName);
      const filteredJoins = otherCharts.map(o => o.predicate).join("\n");
      const outputQuery = `
          create output ${c.chartName}Filtered as
            select ${viewIr.selectQuery}
            from ${i.relation}
            ${filteredJoins}
            ${viewIr.joinQuery}
            ${viewIr.whereQuery}
            ${viewIr.groupByQuery}
            ${viewIr.orderByQuery}
           ;`;
      const outputIr = _getOutputIr(outputQuery, ir);
      ir.outputs.push(outputIr);
    });
  });
  return ir;
}

function _parse(query: string) {
  const inputStream = new ANTLRInputStream(query);
  const l = new lexer.DIELLexer(inputStream);
  const tokenStream = new CommonTokenStream(l);
  return new parser.DIELParser(tokenStream);
}

function _getOutputIr(outputQuery: string, ir: DielIr) {
  LogInfo(`Parsing Output\n ${outputQuery}`);
  const p = _parse(outputQuery);
  const tree = p.outputStmt();
  let visitor = new Visitor();
  visitor.setContext(ir);
  return visitor.visitOutputStmt(tree);
}

function _getViewIr(viewQuery: string, ir: DielIr) {
  LogInfo(`Parsing View\n ${viewQuery}`);
  const p = _parse(viewQuery);
  const tree = p.viewStmt();
  let visitor = new Visitor();
  visitor.setContext(ir);
  return visitor.visitViewStmt(tree);
}


// TODO
// function generateAsyncSql() {
// }

export function genSql(ir: DielIr) {
  const definitionQueries = ir.tables.concat(ir.inputs).map(r => `
create table ${r.name} (timestep, timestamp, ${r.columns.map(c => c.name).join(", ")})`);
  const viewQueries = ir.views.concat(ir.outputs).map(r => `
create view ${r.name} as ${r.query};`);
  const specificTriggers = triggerTemplate(ir);
  const genericProgram = ir.programs.filter(p => (p.input) ? false : true);
  let genericTrigger = null;
  if (genericProgram.length > 0) {
    genericTrigger = triggerGeneric(genericProgram[0]);
  }
  const staticQueries = fs.readFileSync("./src/compiler/static.sql", "utf8");
  return [staticQueries, ...definitionQueries, ...viewQueries, genericTrigger, ...specificTriggers];
}