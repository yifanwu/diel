import { ColumnSelection } from "../../parser/sqlAstTypes";

import { ExprType, ExprColumnAst } from "../../parser/exprAstTypes";

import { DataType } from "../../parser/dielAstTypes";
import { SimpleColumn } from "../DielIr";

export function copyColumnSelection(s: ColumnSelection) {
  return  {
    expr: {
      exprType: ExprType.Column,
      dataType: DataType.TBD,
      columnName: (s.expr as ExprColumnAst).columnName,
      hasStar: false,
      relationName: (s.expr  as ExprColumnAst).relationName,
    },
    alias: s.alias,
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
    alias: original.alias,
  };
}