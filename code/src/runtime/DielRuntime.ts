import { DielIr } from "../compiler/DielIr";
import { Database } from "sql.js";
import { SelectionUnit, SetOperator, AstType } from "../parser/sqlAstTypes";
import { QueryId, RuntimeCell, CellType, ChartData, AnnotatedRows, DbRow,  } from "./runtimeTypes";
import { getSelectionUnitAst } from "../compiler/compiler";
import { getSelectionUnitAnnotation } from "./annotations";
import { DerivedRelationType, DerivedRelation } from "../parser/dielAstTypes";
import { generateSelectionUnit } from "../compiler/codegen/codeGenSql";
// /**
//  * run time cache for performance
//  */
// interface RuntimeQueryCache {
//   query: string;
//   result: OneDimData[] | TwoDimData[];
// }

/**
 * DielIr would now take an empty ast
 * - we would then progressively add queries, also contains the setup logic with the db here
 * - there would be no sql and ts generation here as a result
 * - also use the DielIr internal functions to add the new queries
 */
export default class DielRuntime extends DielIr {
  cells: RuntimeCell[];
  db: Database;

  constructor(loadPage: () => void, dbPath?: string) {
    super();
    this.cells = [];
    this.setup(loadPage, dbPath);
  }

  async setup(loadPage: () => void, dbPath?: string) {
    if (!dbPath) {
      this.db = new Database();
    } else {
      const response = await fetch(dbPath);
      const bufferRaw = await response.arrayBuffer();
      const buffer = new Uint8Array(bufferRaw);
      this.db = new Database(buffer);
      loadPage();
    }
  }

  /**
   * returns the results as an array of objects (sql.js)
   */
  ExecuteAstQuery(ast: SelectionUnit): DbRow[] {
    // const columnTypes = DielIr.GetSimpleColumnsFromSelectionUnit(ast);
    const queryString = generateSelectionUnit(ast);
    return this.ExecuteStringQuery(queryString);
  }

  ExecuteStringQuery(q: string): DbRow[] {
    let r: DbRow[] = [];
    this.db.each(q, (row) => { r.push(row as DbRow); }, () => {});
    return r;
  }

  // TODO low pri
  // ChangeQueryVersion(qId: QueryId, ) {
  // }

  AddQuery(query: string) {
    const viewAst = getSelectionUnitAst(query);
    const cId = this.generateQId();
    const name = this.createCellName(cId);
    const derivedRelation: DerivedRelation = {
      name,
      relationType: DerivedRelationType.PublicView,
      selection: {
        astType: AstType.RelationSelection,
        compositeSelections: [{op: SetOperator.NA, relation: viewAst}]
      }
    };
    this.ast.views.push(derivedRelation);

    const currentAnnotions = getSelectionUnitAnnotation(viewAst);
    const newQuery: RuntimeCell = {
      cId,
      cName: name,
      cType: CellType.Basic,
      versions: [query],
      currentVersionIdx: 0,
      currentAnnotions
    };
    this.cells.push(newQuery);
  }

  ChangeQuery(qId: QueryId, query: string) {
    const q = this.getQueryById(qId);
    q.versions.push(query);
    q.currentVersionIdx += 1;
    // bookkeeping the views?
    // refresh the annotation
  }

  /**
   * TODO
   * this is like refactoring, we need to look at queries dependent on this and change their names too
   * pretty big change..
   * @param qId
   */
  // ModifyCellName(qId: QueryId, newName: string) {
  //   this.getQueryById(qId).cName = newName;
  // }

  // below are private internal functions

  /**
   * internally we need a name for the queries so they can be used as views
   *   and fitted into the DIEL model
   * for now just use the queryId
   */
  private createCellName(qId: QueryId) {
    return `${qId}`;
  }

  private getQueryById(qId: QueryId) {
    return this.cells[qId];
  }

  private generateQId() {
    return this.cells.length;
  }

}