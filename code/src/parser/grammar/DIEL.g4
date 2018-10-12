grammar DIEL;

queries : (inputStmt | outputStmt | programStmt) +;

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
  
programStmt
  : CREATE PROGRAM programBody ';'            #programStmtGeneral
  | CREATE PROGRAM AFTER IDENTIFIER programBody ';' #programStmtSpecific
  ;

programBody
  : BEGIN (insertQuery | selectQuery)+ END
  ;

selectQuery
  : SELECT selectClause (',' selectClause)* FROM relationReference joinClause* whereClause?
  ;

insertQuery
  : INSERT INTO relation=IDENTIFIER '(' column=IDENTIFIER (',' column=IDENTIFIER)* ')' insertBody
  ;

insertBody
  : VALUES '(' value (',' value)* ')' #insertQueryDirect
  | selectQuery                       #insertQuerySelect
  ;


value
  : NUMBER
  | STRING
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
  : IDENTIFIER                             # columnSelectionSimple
  | relation=IDENTIFIER '.' column=IDENTIFIER  # columnSelectionReference
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

CREATE: 'CREATE' | 'create';
INPUT: 'INPUT' | 'input';

INT: 'NUMBER' | 'number';
TEXT: 'STRING' | 'string';
BOOLEAN: 'BOOLEAN' | 'boolean';
OUTPUT: 'OUTPUT' | 'output';
PROGRAM: 'PROGRAM' | 'program';
AFTER: 'AFTER' | 'after';
BEGIN: 'BEGIN' | 'begin';
END: 'END' | 'end';
INSERT: 'INSERT' | 'insert';
INTO: 'INTO' | 'into';

// none statement terms
VALUES: 'VALUES' | 'values';
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


SIMPLE_COMMENT
  : '--' ~[\r\n]* '\r'? '\n'? -> channel(HIDDEN)
  ;

NUMBER
  : MINUS? (DIGIT)+
  ;

STRING
  : '\'' IDENTIFIER '\''
  ;

IDENTIFIER
  : (LETTER | DIGIT | '_')+
  ;
/* We're going to ignore all white space characters */
WS  
  : (' ' | '\t' | '\r'| '\n' | EOF ) -> channel(HIDDEN)
  ;
// WS: [ \r\t\u000C\n]+ -> skip ;
