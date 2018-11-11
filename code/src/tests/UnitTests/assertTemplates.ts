import { applyTempalates } from "../../compiler/compiler";
import { GenerateUnitTestErrorLogger, LogInfo, LogStandout } from "../../lib/messages";

function _assertMapped(logger:  (m: string) => void, snippets: string[], filterString: string, expectedString: string ) {
  const processedFilterString = filterString.replace(/(\n|" ")/gm, "").toLowerCase();
  const genV1Find = snippets.filter(c => c.includes(filterString))[0];
  if (!genV1Find) {
    logger(`${filterString} Not found`);
  }
  if (!genV1Find.includes(expectedString)) {
    logger(`Did not compile template ordinalChart properly for view v1. The generated queries are as follows: \n${genV1Find}`);
  }
}

function assertTemplateBasic() {
  const logger = GenerateUnitTestErrorLogger("assertTemplateBasic");
  const q = `
  CREATE TEMPLATE ordinalChart(v) select {v} as x, count(*) as y from flights;
  create view v1 as use template ordinalChart(v='day');
  create output v2 as select a, b from table1 join (use template ordinalChart(v='day')) as table2;
    `;
  const genCode = applyTempalates(q);
  LogStandout(`Tempalated Query:\n${genCode}`);
  const snippets = genCode.split("\n--gen\n").map(s => s.replace(/(\n|" ")/gm, "").toLowerCase());
  const genV1 = `create view v1 as select day as x, count(*) as y from flights`;
  const filterString = "view v1";
  _assertMapped(logger, snippets, filterString, genV1);
  const genV2 = `create output v2 as select a, b from table1 join (select day as x, count(*) as y from flights) as table2`;
  const filterStringV2 = "output v2";
  _assertMapped(logger, snippets, filterStringV2, genV2);
  LogInfo(`assertBasic passed`);
  return true;
}

// function assertTemplateJoin() {
//   const q = `  CREATE TEMPLATE ordinalFilter(v)
//   join (
//     select high, low from currentItx WHERE chart = '{v}'
//   ) {v}Itx on (flights.{v} <= {v}Itx.high and flights.{v} >= {v}Itx.low)
//         or ({v}Itx.low IS NULL);
//   CREATE CROSSFILTER xFlights on flights
//   BEGIN
//     create xchart dayChart
//     as select a from test1
//     with predicate use template ordinalFilter(v='day');
//   END;
// `;
// }

assertTemplateBasic();