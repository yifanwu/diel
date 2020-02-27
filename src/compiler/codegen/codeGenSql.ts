import { ReportDielUserError, LogInternalError, DielInternalErrorType, LogInternalWarning } from "../../util/messages";
import { SqlAst, SqlRelationType, SqlRelation, SqlOriginalRelation, SqlDerivedRelation, TriggerAst } from "../../parser/sqlAstTypes";
import { DropClause, AstType, DropType, Command, InsertionClause, RelationSelection, CompositeSelection, SetOperator, CompositeSelectionUnit, SelectionUnit, RelationReference, ColumnSelection, JoinType, JoinAst, ExprAst, ExprType, ExprValAst, DielDataType, ExprColumnAst, ExprRelationAst, ExprParen, ExprFunAst, FunctionType, BuiltInFunc, GroupByAst, OrderByAst, Order, Column, RelationReferenceType, RelationReferenceDirect, RelationReferenceSubquery, ExprStarAst, DeleteClause, DerivedRelation, RelationType } from "../../parser/dielAstTypes";
import { DbDriver } from "../..";

// export function generateSqlFromDielAst(ast: DielAst, options?: { replace: boolean; isRemote: boolean}) {
//   const isRemote = options ? options.isRemote ? options.isRemote : false : false;
//   const sqlAst = createSqlAstFromDielAst(ast, isRemote);
//   const replace = options ? options.replace ? options.replace : false : false;
//   return generateStringFromSqlIr(sqlAst, replace);
// }

export function generateCleanUpAstFromSqlAst(ast: SqlAst): DropClause[] {
  // basically drop everything
  // triggers etc.
  const tables: DropClause[] = ast.relations.map(r => ({
    astType: AstType.Drop,
    dropType: r.relationType === SqlRelationType.Table ? DropType.Table : DropType.View,
    dropName: r.rName,
    isMaterialized: r.relationType === SqlRelationType.View && (r as SqlDerivedRelation).isMaterialized,
  }));

  let triggers: DropClause[] = ast.triggers.map(t => ({
      astType: AstType.Drop,
      dropType: DropType.Trigger,
      dropName: t.tName,
      dropAfter: t.afterRelationName,
    }));
  // note that we might need to do dependency order?
  return triggers.concat(tables);
}

export function generateStringFromSqlIr(sqlAst: SqlAst, replace = false, dbDrvier?: DbDriver): string[] {
  // if remoteType is server, then we need to drop the old ones if we want to make a new one
  // we need to architect this properly to scale, but a quick fix for now
  const relations = sqlAst.relations.map(t => GenerateSqlRelationString(t, replace, dbDrvier));
  let triggers = sqlAst.triggers.map(t => generateTrigger({ trigger: t, replace }, dbDrvier));
  let commands = sqlAst.commands.map(c => generateCommand(c, dbDrvier));
  return relations.concat(triggers).concat(commands);
}

function generateCommand(command: Command, dbDrvier?: DbDriver): string {
  switch (command.astType) {
    case AstType.Delete:
      return generateDelete(command as DeleteClause);
    case AstType.Insert:
      return generateInserts(command as InsertionClause);
    case AstType.Drop:
      return generateDrop(command as DropClause, dbDrvier);
    case AstType.RelationSelection:
      return generateSelect((command as RelationSelection).compositeSelections);
    default:
      LogInternalError(`Other AstTypes ${command.astType} not handled`, DielInternalErrorType.UnionTypeNotAllHandled);
      return "";
  }
}

export function generateDrop(command: DropClause, dbDrvier?: DbDriver) {
  const isViewAndMaterializedPostgres = command.isMaterialized &&
    dbDrvier && dbDrvier === DbDriver.Postgres &&
    command.dropType === DropType.View;
  let dropFunction = "";
  if (isViewAndMaterializedPostgres) {
    // drop the function too
    dropFunction = `DROP FUNCTION IF EXISTS refresh_mat_view_${command.dropName} CASCADE;`;
  }
  return `${dropFunction} ` +
    `DROP ${isViewAndMaterializedPostgres ? "MATERIALIZED " : ""}` +
    `${command.dropType} ` +
    `IF EXISTS ` +
    `${command.dropName} ` +
    `${(dbDrvier && dbDrvier === DbDriver.Postgres && command.dropType === DropType.Trigger) ? `ON ${command.dropAfter} ` : ""}` +
    `${(dbDrvier && dbDrvier === DbDriver.Postgres) ? `CASCADE` : ""};`
    ;
}

export function generateDelete(command: DeleteClause) {
  const pred = command.predicate
    ? `WHERE ${GetSqlStringFromExpr(command.predicate)}`
    : ""
    ;
  return `DELETE FROM ${command.relationName} ${pred};`;
}

export function GenerateSqlRelationString(r: SqlRelation, replace = false, dbDrvier?: DbDriver): string {

  switch (r.relationType) {
    case SqlRelationType.Table:
      return generateTableSpec(r as SqlOriginalRelation, replace, dbDrvier);
    case SqlRelationType.View:
      return generateSqlViews(r as SqlDerivedRelation, replace, dbDrvier);
    default:
      LogInternalError("Not all Sql relation types are handled", DielInternalErrorType.UnionTypeNotAllHandled);
      return "";
  }
}

// FIXME note that we should probably not use the if not exist as a crutch
function generateTableSpec(t: SqlOriginalRelation, replace = false, dbDrvier?: DbDriver): string {
  const replaceQuery = replace ? `DROP TABLE IF EXISTS ${t.rName}
  ${(dbDrvier && dbDrvier === DbDriver.Postgres) ? "CASCADE" : ""};` : "";
  return `${replaceQuery}
  CREATE TABLE ${t.rName} (
${t.columns.map(c => "    " + generateColumnDefinition(c)).join(",\n")}
  )`;
}

// helper function for quick DIEL code inspection

export function GenerateStrFromDielDerivedRelation(v: DerivedRelation) {
  const rStr = v.relationType === RelationType.EventView
    ? "event view"
    : v.relationType === RelationType.Output
      ? "output"
      : "view"
      ;
  return `create ${rStr} ${v.rName} AS ${generateSelect(v.selection.compositeSelections)}`;
}

export function generatePostgresFunction(vName: string, originalRelations: Set<string>): string {
  if (originalRelations.size > 0) {
    // create a function once but multiple triggers for each original Relations
    const functionName = `refresh_mat_view_${vName}`;
    const functionQuery = `create or replace function ${functionName}()
      returns trigger language plpgsql as
      $$
        begin
          refresh materialized view ${vName};
          return null;
        end
      $$;
      `;
    return functionQuery;
  }
  return "";
}

export function generateSqlViews(v: SqlDerivedRelation, replace = false, dbDrvier?: DbDriver): string {
  const replaceQuery = replace ? `DROP VIEW IF EXISTS ${v.rName}
    ${(dbDrvier && dbDrvier === DbDriver.Postgres) ? "CASCADE" : ""};` : "";
  const materialize = v.isMaterialized ? `MATERIALIZED` : "";
  const triggerQueries = v.isMaterialized && v.originalRelations && dbDrvier === DbDriver.Postgres ?
    generatePostgresFunction(v.rName, v.originalRelations) : "";
  return `${replaceQuery}
  CREATE ${materialize} VIEW ${v.rName} AS
  ${generateSelect(v.selection)};
  ${triggerQueries}
  `;
}

export function generateSelect(v: CompositeSelection): string {
  return v.map(c => GetSqlStringFromCompositeSelectionUnit(c)).join("\n");
}

const setOperatorToString = new Map([
  [SetOperator.NA, ""],
  [SetOperator.UNION, "UNION"],
  // [SetOperator.EXCEPT, "EXCEPT"],
  // [SetOperator.UNIONALL, "UNION ALL"],
  [SetOperator.INTERSECT, "INTERSECT"],
]);

export function GetSqlStringFromCompositeSelectionUnit(c: CompositeSelectionUnit): string {
  const op = setOperatorToString.get(c.op);
  const query = SqlStrFromSelectionUnit(c.relation);
  // the replace is a temporay patch to make the results look better
  return `${op} ${query}`.replace(/  \n[  \n]+/g, " ");
}

export function SqlStrFromSelectionUnit(v: SelectionUnit): string {
  // sometimes might want to use the un-normalized case for a quick SQL string...
  const selection = v.derivedColumnSelections
    ? generateColumnSelection(v.derivedColumnSelections)
    : generateColumnSelection(v.columnSelections)
    ;

  return `SELECT ${v.isDistinct ? "DISTINCT" : ""} ${selection}
    ${SqlStrFromSelectionUnitBody(v)}
  `;
}

/**
 * this is exported so that the codeDiv can use it
 * need to be cleaner for the future
 * @param v
 */
export function SqlStrFromSelectionUnitBody(v: SelectionUnit) {
  const w = (v.whereClause) ? generateWhere(v.whereClause) : "";
  return `${v.baseRelation ? `FROM ${sqlStrFromRelationReference(v.baseRelation)}` : ""}
  ${v.joinClauses ? v.joinClauses.map(j => generateJoin(j)).join("\n") : ""}
  ${w}
  ${generateGroupBy(v.groupByClause)}
  ${generateOrderBy(v.orderByClause)}
  ${generateLimit(v.limitClause)}`;
}

function sqlStrFromRelationReference(ref: RelationReference): string {
  // here there will be no stars..
  let query = "";
  switch (ref.relationReferenceType) {
    case RelationReferenceType.Direct: {
      const r = ref as RelationReferenceDirect;
      query += r.relationName;
      break;
    }
    case RelationReferenceType.Subquery: {
      const r = ref as RelationReferenceSubquery;
      query += `(${generateSelect(r.subquery.compositeSelections)})`;
      break;
    }
    default:
      LogInternalError(`RelationReference ${ref.relationReferenceType} not handled`, DielInternalErrorType.UnionTypeNotAllHandled);
  }
  if (ref.alias) {
    query += ` AS ${ref.alias}`;
  }
  return query;
}

/**
 * Note that here we will assume there is no
 * @param s
 */
function generateColumnSelection(s: ColumnSelection[]): string {

  if (!s || s.length === 0) {
    return "";
  }
  return `${s.map(c => {
    const alias = c.alias ? ` AS ${c.alias}` : "";
    return GetSqlStringFromExpr(c.expr) + alias;
  }).join(", ")}`;
}

const joinOpToString = new Map([
  [JoinType.LeftOuter, "LEFT OUTER JOIN"],
  [JoinType.Inner, "JOIN"],
  [JoinType.CROSS, "CROSS JOIN"],
  [JoinType.Natural, "NATURAL JOIN"],
]);

function generateJoin(j: JoinAst): string {
  if (!j) return "";
  const op = joinOpToString.get(j.joinType);
  const pred = j.predicate
    ? `ON ${GetSqlStringFromExpr(j.predicate)}`
    : ""
    ;
  return `${op} ${sqlStrFromRelationReference(j.relation)} ${pred}`;
}

function generateWhere(e: ExprAst | undefined): string {
  if (!e) return "";
  return `WHERE ${GetSqlStringFromExpr(e)}`;
}

// recursive fun...
export function GetSqlStringFromExpr(e: ExprAst): string | null {
  switch (e.exprType) {
    case ExprType.Val:
      const v = e as ExprValAst;
      const str = v.value.toString();
      if ((e.dataType === DielDataType.String) || (e.dataType === DielDataType.TimeStamp)) {
        return `'${str}'`;
      }
      return str;
    case ExprType.Star: {
      const s = e as ExprStarAst;
      const prefix = s.relationName ? `${s.relationName}.` : "";
      return `${prefix}*`;
    }
    case ExprType.Column: {
      const c = e as ExprColumnAst;
      const prefix = c.relationName ? `${c.relationName}.` : "";
      return `${prefix}${c.columnName}`;
    }
    case ExprType.Relation:
      const r = e as ExprRelationAst;
      return `(${generateSelect(r.selection.compositeSelections)})`;
    case ExprType.Parenthesis:
      const p = e as ExprParen;
      return `(${GetSqlStringFromExpr(p.content)})`;
    case ExprType.Func:
      const f = e as ExprFunAst;
      // this is functions
      switch (f.functionType) {
        case FunctionType.Math:
        case FunctionType.Compare:
        case FunctionType.Logic:
          // assert that there are two args
          if (f.args.length !== 2) {
            ReportDielUserError(`Function ${f.functionReference} should have 2 arguemnts`);
          }
          return `${GetSqlStringFromExpr(f.args[0])} ${f.functionReference} ${GetSqlStringFromExpr(f.args[1])}`;
        case FunctionType.BuiltIn:
          switch (f.functionReference) {
            case BuiltInFunc.ConcatStrings:
              return f.args.map(a => GetSqlStringFromExpr(a)).join(" || ");
            case BuiltInFunc.IfThisThen:
              const whenCond = GetSqlStringFromExpr(f.args[0]);
              const thenExpr = GetSqlStringFromExpr(f.args[1]);
              const elseExpr = GetSqlStringFromExpr(f.args[2]);
              return `CASE WHEN ${whenCond} THEN ${thenExpr} ELSE ${elseExpr} END`;
            case BuiltInFunc.ValueIsNotNull:
            case BuiltInFunc.ValueIsNull:
              // should only have one
              if (f.args.length !== 1) {
                LogInternalError(`Is or Not Null filters should only have one argument`);
              }
              return `${GetSqlStringFromExpr(f.args[0])} ${f.functionReference}`;
            default:
              // the rest should work with their references
              return `${f.functionReference} (${f.args.map(a => GetSqlStringFromExpr(a)).join(", ")})`;
          }
        case FunctionType.Custom:
          return `${f.functionReference} (${f.args.map(a => GetSqlStringFromExpr(a)).join(", ")})`;
        default:
          LogInternalError(`FunctionType type ${f.functionType} not handled`, DielInternalErrorType.UnionTypeNotAllHandled);
          return null;
      }
    default:
      LogInternalError(`Expr type ${e.exprType} not handled`, DielInternalErrorType.UnionTypeNotAllHandled);
      return null;
  }
}

function generateGroupBy(g: GroupByAst | undefined): string {
  if (!g) return "";
  const groups = g.selections.map(sI => GetSqlStringFromExpr(sI)).join(", ");
  if (g.predicate) {
    return `GROUP BY ${groups} HAVING ${GetSqlStringFromExpr(g.predicate)}`;
  } else {
    return `GROUP BY ${groups}`;
  }
}

function generateOrderBy(o: OrderByAst[] | undefined): string {
  if (!o) return "";
  const orders = o.map(i => `${GetSqlStringFromExpr(i.selection)} ${generateOrder(i.order)}`);
  return `ORDER BY ${orders.join(", ")}`;
}

function generateOrder(order: Order): string {
  if (!order) return "";
  return order === Order.ASC
    ? "ASC"
    : "DESC";
}

function generateLimit(e: ExprAst | undefined): string {
  if (!e) return "";
  return `LIMIT ${GetSqlStringFromExpr(e)}`;
}

function generateTrigger({ trigger, replace = false }: { trigger: TriggerAst; replace?: boolean; }, dbDrvier?: DbDriver): string {
  const replaceQuery = replace ? `DROP TRIGGER IF EXISTS ${trigger.tName}
    ${(dbDrvier && dbDrvier === DbDriver.Postgres) ? `ON ${trigger.afterRelationName} CASCADE` : ""};` : "";
  if (dbDrvier && dbDrvier === DbDriver.Postgres && trigger.functionName) {
    // postgres trigger
    return `${replaceQuery}
    CREATE TRIGGER ${trigger.tName}
    AFTER INSERT ON ${trigger.afterRelationName}
    FOR EACH STATEMENT
    EXECUTE PROCEDURE ${trigger.functionName}();
    `;
  } else {
    // sqlite trigger
    let program = `${replaceQuery}
    CREATE TRIGGER ${trigger.tName} AFTER INSERT ON ${trigger.afterRelationName}\nBEGIN\n`;
    program += trigger.commands.map(p => generateCommand(p, dbDrvier)).join("\n");
    program += "\nEND;";
    return program;
  }
}

export function generateInsertClauseStringForValue(raw: any): string {
  // it can be explicitly set to null, but not undefined
  if (raw === undefined) {
    LogInternalError(`Insertion should be defined.`);
  }
  // need to avoid the case when 0 is entered, which is valid!
  return (raw === null)
    ? "null"
    : (typeof raw === "string") ? `'${raw}'` : raw
    ;
}

function generateInserts(i: InsertionClause): string {
  if (!i) return "";
  const columns = i.columns && i.columns.length > 0
    ? `(${i.columns.map(c => c).join(", ")})`
    : "";
  const values = i.values
    ? `VALUES (${i.values.map(v => generateInsertClauseStringForValue(v)).join(", ")})`
    : i.selection
      ? generateSelect(i.selection.compositeSelections)
      : "";
  return `INSERT INTO ${i.relation} ${columns} ${values};`;
}

const TypeConversionLookUp = new Map<DielDataType, string>([
  [DielDataType.String, "TEXT"],
  [DielDataType.Number, "REAL"],
  [DielDataType.Boolean, "INTEGER"],
  [DielDataType.TimeStamp, "DATETIME"]
]);

function generateColumnDefinition(c: Column): string {
  const typeStr = TypeConversionLookUp.get(c.dataType);
  if (!typeStr) {
    LogInternalError(`data type ${c.dataType} is not mapped to string`);
  }
  const plainQuery = `${c.cName} ${typeStr}`;
  if (!c.constraints) {
    // LogInternalError(`Constraints for column ${c.name} is not defined`);
    return plainQuery;
  }
  const notNull = c.constraints.notNull ? "NOT NULL" : "";
  const unique = c.constraints.unique ? "UNIQUE" : "";
  const primary = c.constraints.primaryKey ? "PRIMARY KEY" : "";
  const autoincrement = c.constraints.autoincrement ? "AUTOINCREMENT" : "";
  const defaultVal = c.defaultValue ? `DEFAULT ${GetSqlStringFromExpr(c.defaultValue)}` : "";
  return `${plainQuery} ${notNull} ${unique} ${primary} ${autoincrement} ${defaultVal}`;
}