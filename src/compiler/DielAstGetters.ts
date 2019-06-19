import { LogInternalError, DielInternalErrorType } from "../util/messages";
import { SelectionUnit, DielAst, RelationType, OriginalRelation, Relation, ExprType, ExprColumnAst, RelationNameType, ExprFunAst, SimpleColumn, BuiltInColumn, DielDataType } from "../parser/dielAstTypes";
import { DerivedRelation } from "..";
import { EventTableColumns, EventViewColumns } from "./passes/distributeQueries";

const DerivedRelationTypes = new Set([RelationType.View, RelationType.EventView, , RelationType.Output, RelationType.DerivedTable]);
const OriginalRelationTypes = new Set([RelationType.Table, RelationType.EventTable, RelationType.ExistingAndImmutable]);

// --------------- BEGIN CHECKERs --------------------

export function IsRelationTypeDerived(rType: RelationType) {
  if (DerivedRelationTypes.has(rType)) {
    return true;
  } else if (OriginalRelationTypes.has(rType)) {
    return false;
  } else {
    LogInternalError(`RelationType ${rType} is not defined to be derived or not`);
    return null;
  }
}

// --------------- BEGIN GETTERS --------------------

export function DeriveColumnsFromRelation(r: Relation): SimpleColumn[] {
  if (IsRelationTypeDerived(r.relationType)) {
    const d = r as DerivedRelation;
    const originalColumns = DeriveColumnsFromSelectionUnit(d.selection.compositeSelections[0].relation);
    const derivedColumns = r.relationType === RelationType.EventView
      // this casting is a bit brittle; should think more about the types
      ? originalColumns.concat(EventViewColumns as SimpleColumn[])
      : originalColumns
      ;
    return derivedColumns;
  } else {
    const o = r as OriginalRelation;
    const originalColumns: SimpleColumn[] = o.columns.map(c => ({
      cName: c.cName,
      dataType: c.dataType
    }));
    const derivedColumns = r.relationType === RelationType.EventTable
      ? originalColumns.concat(EventTableColumns as SimpleColumn[])
      : originalColumns
      ;
    return derivedColumns;
  }
}

export function DeriveColumnsFromSelectionUnit(su: SelectionUnit): SimpleColumn[] | null {
  const columns: SimpleColumn[] = [];
  if (!su.derivedColumnSelections) return LogInternalError(`These should be defined already! Might not be visiting from topoligical order.`);
  for (let i = 0; i < su.derivedColumnSelections.length; i ++) {
    const column = su.derivedColumnSelections[i];
    switch (column.expr.exprType) {
      case ExprType.Column:
        const columnExpr = column.expr as ExprColumnAst;
        columns.push({
          cName: column.alias,
          dataType: columnExpr.dataType
        });
        break;
      case ExprType.Func:
        const functionExpr = column.expr as ExprFunAst;
        columns.push({
          cName: column.alias,
          dataType: functionExpr.dataType
        });
        break;
      default:
        return LogInternalError(`${column.expr.exprType} Not handled`, DielInternalErrorType.UnionTypeNotAllHandled);
    }
  }
  return columns;
}

export function GetAllDerivedViews(ast: DielAst): DerivedRelation[] {
  return ast.relations.filter(r => IsRelationTypeDerived(r.relationType)) as DerivedRelation[];
}

export function GetAllPrograms(ast: DielAst | DielAst) {
  return ast.programs;
}

export function GetAllStaticOriginalTables(ast: DielAst): OriginalRelation[] {
  return ast.relations.filter(r => r.relationType === RelationType.ExistingAndImmutable) as OriginalRelation[];
}

export function GetAllDielDefinedOriginalRelations(ast: DielAst): OriginalRelation[] {
  return ast.relations.filter(r => (r.relationType === RelationType.EventTable)
                                || (r.relationType === RelationType.Table)
                                ) as OriginalRelation[];
}

export function GetOriginalRelations(ast: DielAst): OriginalRelation[] {
  return ast.relations.filter(r => !IsRelationTypeDerived(r.relationType)) as OriginalRelation[];
}

export function GetAllOutputs(ast: DielAst): DerivedRelation[] {
  return ast.relations.filter(r => r.relationType === RelationType.Output) as DerivedRelation[];
}

export function GetRelationDef(ast: DielAst, rName: string): Relation | null {
  // first search in original, then serach in derived, compalin otherwise
  const result = ast.relations.find(r => r.rName === rName);
  if (result) {
    return result;
  } else {
    return LogInternalError(`[GetRelationDef]: Relation ${rName} not defined`);
  }
}

// --------------- BEGIN DERIVERS --------------------



// --------------  ---------------

export function IsRelationEvent(ast: DielAst, rName: RelationNameType) {
  const r = GetRelationDef(ast, rName);
  return (r.relationType === RelationType.EventTable) || (r.relationType === RelationType.EventView);
}