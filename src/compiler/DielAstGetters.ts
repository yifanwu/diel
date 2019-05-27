import { LogInternalError, DielInternalErrorType } from "../util/messages";
import { SelectionUnit, DielAst, RelationType, OriginalRelation, Relation, ExprType, ExprColumnAst, RelationNameType, ExprFunAst, SimpleColumn } from "../parser/dielAstTypes";
import { DerivedRelation } from "..";

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
    return DeriveColumnsFromSelectionUnit(d.selection.compositeSelections[0].relation);
  } else {
    const o = r as OriginalRelation;
    return o.columns.map(c => ({
      columnName: c.cName,
      dataType: c.dataType
    }));
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
          columnName: column.alias,
          dataType: columnExpr.dataType
        });
        break;
      case ExprType.Func:
        const functionExpr = column.expr as ExprFunAst;
        columns.push({
          columnName: column.alias,
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



// -------------- CHERS ---------------

export function IsRelationEvent(ast: DielAst, rName: RelationNameType) {
  const r = GetRelationDef(ast, rName);
  return r.relationType === RelationType.EventTable;
}

// export class DielIr {

//   ast: DielAstFinal;
//   dependencies: DependencyInfo;
//   private allDerivedRelations: Map<string, DerivedRelationFinal>;
//   // private allCompositeSelections: Map<string, CompositeSelection>;
//   private allOriginalRelations: Map<string, OriginalRelationFinal>;
//   constructor(ast: DielAst) {
//     this.ast = ast;
//     // this.buildIndicesToIr();
//     // const allCompositeSelections = new Map();
//     // this.applyToAllCompositeSelection<void>((r, name) => {
//     //   allCompositeSelections.set(name, r);
//     // });
//     // this.allCompositeSelections = allCompositeSelections;
//     this.allOriginalRelations = new Map();
//     this.GetOriginalRelations().map((r) => {
//       this.allOriginalRelations.set(r.rName, r);
//     });
//     this.allDerivedRelations = new Map();
//     this.GetAllDerivedViews().map((r) => {
//       this.allDerivedRelations.set(r.rName, r);
//     });
//   }


  // THINK: we should probably do relations name?
  // i think the materialization step wants this as well
  // public GetDependentInputs(relationName: string) {
  //   // get all its depdencies
  // }


  // public GetColumnsFromRelationName(relationName: string): SimpleColumn[] | null {
  //   const relationDef = this.GetRelationDefinition(relationName);
  //   if (relationDef) {
  //     if (IsRelationTypeDerived(relationDef.relationType)) {
  //       return columnsFromSelectionUnit((relationDef as DerivedRelationFinal).selection.compositeSelections[0].relation);
  //     } else {
  //       return (relationDef as OriginalRelationFinal).columns.map(c => ({columnName: c.cName, type: c.type}));
  //     }
  //   } else {
  //     // note for LUCIE: this is a good place to add the fuzzy search for correct relation name suggestion
  //     return LogInternalError(`Cannot find relation ${relationName}`, DielInternalErrorType.RelationNotFound);
  //   }
  // }

//   public GetRelationDefinition(relationName: RelationIdType) {
//     return this.ast.relations.find(r => r.rName === relationName);
//   }

//   public GetAllDerivedViews(): DerivedRelationFinal[] {
//     return this.ast.relations.filter(r => IsRelationTypeDerived(r.relationType)) as DerivedRelationFinal[];
//   }
//   public GetOriginalRelations(): OriginalRelationFinal[] {
//     return this.ast.relations.filter(r => !IsRelationTypeDerived(r.relationType)) as OriginalRelationFinal[];
//   }

//   public GetDielDefinedOriginalRelation() {
//     return this.GetOriginalRelations().filter(r => r.relationType !== RelationType.ExistingAndImmutable);
//   }

//   public 

//   /**
//    * returns all the event relations by name
//    */
//   public GetEventRelationNames() {
//     return this.ast.relations
//       .filter(r => ((r.relationType === RelationType.EventTable) || (r.relationType === RelationType.EventView)))
//       .map(i => i.rName);
//   }

//   public GetAllRelationNames() {
//     return this.ast.relations.map(i => i.rName);
//   }

//   /**
//    * Warning: this method does not actually visit all the selection units
//    *   e.g., if it's a where predicate with a subquery, it's not going to visit the unit
//    *         selection from that subquery.
//    * @param fun
//    * @param byDependency
//    */
//   public 


// // }