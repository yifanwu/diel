import { SqlRelation, SqlOriginalRelation, SqlAst } from "../../parser/sqlAstTypes";
import { RelationNameType } from "../../parser/dielAstTypes";

export function GetSqlRelationFromAst(ast: SqlAst, rName: RelationNameType): SqlRelation | null {
  return ast.relations.find(r => r.rName === rName);
}

export function GetDynamicRelationsColumns(r: SqlOriginalRelation): string[] {
  return r.columns.map(c => c.cName);
}