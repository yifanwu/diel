import { ExprType, ExprColumnAst, DielDataType, ColumnSelection } from "../../parser/dielAstTypes";
import { SimpleColumn } from "../DielIr";

export function copyColumnSelection(s: ColumnSelection) {
  const columnName = (s.expr as ExprColumnAst).columnName;
  return {
    expr: {
      exprType: ExprType.Column,
      dataType: DielDataType.TBD,
      columnName,
      hasStar: false,
      relationName: (s.expr  as ExprColumnAst).relationName,
    },
    alias: s.alias ? s.alias : columnName,
  };
}

export function createColumnSectionFromRelationReference(original: ColumnSelection, simpleColomn: SimpleColumn, relationName: string) {
  return {
    expr: {
      exprType: ExprType.Column,
      dataType: simpleColomn.type,
      columnName: simpleColomn.columnName,
      hasStar: false,
      relationName,
    },
    alias: original.alias ? original.alias : simpleColomn.columnName,
  };
}