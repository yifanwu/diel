grammar DIEL;

// (inputStmt | outputStmt | programStmt) *;

queries : (inputStmt | outputStmt) +;

columnType
  : INT | TEXT | BOOLEAN
  ;

columnDefinition
  : IDENTIFIER columnType
  ;

inputStmt
  : CREATE INPUT IDENTIFIER '(' columnDefinition (',' columnDefinition)* ');'
  ;

outputStmt
  : CREATE OUTPUT IDENTIFIER AS selectQuery ';'
  ;

selectQuery
  : SELECT selectClause (',' selectClause)* FROM relationReference joinClause* whereClause
  ;

joinClause
  : JOIN relationReference ON predicates
  ;

whereClause
  : WHERE predicates
  ;

relationReference
  : IDENTIFIER                                  # simpleRelationReference
  | relation=IDENTIFIER AS? alias=IDENTIFIER    # aliasedRelationReference
  ;

selectClause
  : columnSelection        # selectClauseSimple
  | udfExpr AS IDENTIFIER  # selectClauseFunction
  | mathExpr AS IDENTIFIER # selectClauseMath
  ;

columnSelection
  : IDENTIFIER                             # columnSelectionSimpe
  | relation=IDENTIFIER.column=IDENTIFIER  # columnSelectionReference
  ;

mathExpr
  : columnSelection mathOp columnSelection # mathExprBase
  | mathExpr mathOp columnSelection        # mathExprMore
  ;

udfExpr
  : function=IDENTIFIER '(' columnSelection (',' columnSelection)*  ')'
  ;

predicates
  : singlePredicate                # predicateClauseSingle
  | predicates AND singlePredicate # predicateClauseAnd
  | predicates OR singlePredicate  # predicateClauseOr
  ;

singlePredicate
  : columnSelection compareOp columnSelection # singlePredicateColumns
  | columnSelection compareOp NUMBER          # singlePredicateNumber
  ;

mathOp
  : '+' #mathOpAdd
  | '-' #mathOpSub
  | '*' #mathOpMul
  | '/' #mathOpDiv
  ;

// still need to do has, exists etc.
compareOp
  : '='     # compareOpEqual
  | '>'     # compareOpGreater
  | '<'     # compareOpLess
  | udfExpr # compareOpFunction
  ;

// programStmt
//   : CREATE PROGRAM AFTER IDENTIFIER BEGIN// ANY END #specificProgram
//   | CREATE PROGRAM BEGIN //ANY END                  #generalProgram
//   ;
CREATE: 'CREATE' | 'create';
INPUT: 'INPUT' | 'input';

INT: 'NUMBER' | 'number';
TEXT: 'STRING' | 'string';
BOOLEAN: 'BOOLEAN' | 'boolean';

OUTPUT: 'OUTPUT' | 'output';

// generic SQL
AS: 'AS' | 'as';
SELECT: 'SELECT' | 'select';
FROM: 'FROM' | 'from';
JOIN: 'JOIN' | 'join';
ON: 'ON' | 'on';
WHERE: 'WHERE' | 'where';
GROUP: 'GROUP' | 'group';
BY: 'BY' | 'by';
AND: 'AND' | 'and';
OR: 'OR' | 'or';
MINUS: '-';
// PROGRAM: 'PROGRAM';
// AFTER: 'AFTER';
// BEGIN: 'BEGIN';
// END: 'END';

// fragment SPACE : ' ';

fragment DIGIT
  : [0-9]
  ;

fragment LETTER
  : [A-Z]
  | [a-z]
  ;

// ANY
//   : (LETTER | DIGIT | '_' | ' ' | '\n' | '|')*
//   ;

IDENTIFIER
  : (LETTER | DIGIT | '_')+
  ;

SIMPLE_COMMENT
  : '--' ~[\r\n]* '\r'? '\n'? -> channel(HIDDEN)
  ;

NUMBER
  : MINUS? (DIGIT)+
  ;

/* We're going to ignore all white space characters */
WS  
  : (' ' | '\t' | '\r'| '\n') -> channel(HIDDEN)
  ;
// WS: [ \r\t\u000C\n]+ -> skip ;
