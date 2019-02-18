grammar DIEL;

queries : (
           viewStmt
           | programStmt
           | staticTableStmt
           | crossfilterStmt
           | templateStmt
           | insertQuery
           //  the rest does not require templating
           | originalTableStmt
           | registerTypeUdf
           | dropQuery
          )+;

staticTableStmt
  : CREATE TABLE IDENTIFIER AS selectQuery DELIM
  ;

registerTypeUdf
  : REGISTER UDF IDENTIFIER TYPE dataType DELIM
  ;

templateStmt
  : CREATE TEMPLATE templateName=IDENTIFIER
    '(' IDENTIFIER (',' IDENTIFIER)* ')'
    (selectQuery | joinClause)
    DELIM
  ;

crossfilterStmt
  : CREATE CROSSFILTER crossfilterName=IDENTIFIER ON relation=IDENTIFIER
    BEGIN crossfilterChartStmt+ END
    DELIM
  ;

crossfilterChartStmt
  : CREATE XCHART chart=IDENTIFIER
    AS definitionQuery=selectQuery
    WITH PREDICATE predicateClause=joinClause
    DELIM
  ;

dataType
  : INT | TEXT | BOOLEAN
  ;

columnDefinition
  : IDENTIFIER dataType columnConstraints*
  ;

constraintDefinition
  : PRIMARY KEY '(' IDENTIFIER (',' IDENTIFIER)* ')'
  | UNIQUE '(' IDENTIFIER (',' IDENTIFIER)*  ')'
  | IDENTIFIER NOT NULL
  | FOREIGN KEY '(' column=IDENTIFIER ')' REFERENCES table=IDENTIFIER'(' otherColumn=IDENTIFIER ')'
  | SINGLE LINE
  | CHECK (expr)
  ;

originalTableStmt
  : (REGISTER|CREATE) (INPUT|TABLE) IDENTIFIER relationDefintion DELIM
  ;

relationDefintion
  :  '(' columnDefinition (',' columnDefinition)* (',' constraintDefinition)* ')' # relationDefintionDirect
  | AS IDENTIFIER # relationDefintionCopy
  ;

// outputStmt
//   : CREATE OUTPUT IDENTIFIER AS selectQuery
//     (constraintClause)?
//     DELIM
//   ;

constraintClause
  :  CONSTRAIN  constraintDefinition (',' constraintDefinition)*
  ;

columnConstraints
  : UNIQUE
  | PRIMARY KEY
  | NOT NULL
  ;

viewStmt
  : CREATE VIEW IDENTIFIER AS selectQuery
    (constraintClause)?
    DELIM
  ;

programStmt
  : CREATE PROGRAM programBody ';'                  # programStmtGeneral
  | CREATE PROGRAM AFTER IDENTIFIER programBody ';' # programStmtSpecific
  ;

// defining aProgram so that we can retrieve the order of the specification
programBody
  : BEGIN aProgram+ END
  ;

aProgram
  : insertQuery 
  | selectQuery
  ;

selectQuery
  : selectUnitQuery compositeSelect* # selectQueryDirect
  | templateQuery                    # selectQueryTemplate
  ;

templateQuery
  : USE TEMPLATE templateName=IDENTIFIER '(' variableAssignment (',' variableAssignment)* ')'
  ;

dropQuery
  : DROP TABLE IDENTIFIER
  ;

variableAssignment
  : variable=IDENTIFIER '=' assignment=STRING
  ;

compositeSelect
  : setOp selectUnitQuery
  ;

setOp
  : UNION
  | INTERSECT
  | UNION ALL 
  | EXCEPT
  ;

selectUnitQuery
  : SELECT
    selectColumnClause (',' selectColumnClause)*
    (
      FROM
      relationReference
      joinClause*
      whereClause?
      groupByClause?
      orderByClause?
      limitClause?
    )?
  ;

whereClause
  : WHERE expr
  ;

groupByClause
  : GROUP BY expr (',' expr)* havingClause?
  ;

havingClause
  : HAVING expr
  ;

orderByClause
  : ORDER BY orderSpec (',' orderSpec)*
  ;

orderSpec
  : expr (ASC|DESC)?
  ;

insertQuery
  : INSERT INTO relation=IDENTIFIER
    '(' column=IDENTIFIER (',' column=IDENTIFIER)* ')' 
    insertBody
    DELIM
  ;

insertBody
  : VALUES '(' value (',' value)* ')' # insertBodyDirect
  | selectQuery                       # insertBodySelect
  ;

joinClause
  : (((LEFT OUTER)? JOIN) | ',') relationReference (ON expr)? # joinClauseBasic
  | templateQuery                                             # joinClauseTemplate
  ;

limitClause
  : LIMIT expr
  ;

relationReference
  : relation=IDENTIFIER (AS? alias=IDENTIFIER)? # relationReferenceSimple
  | '(' selectQuery ')' (AS? alias=IDENTIFIER)? # relationReferenceSubQuery
  ;

expr
  : unitExpr                                 # exprSimple
  | NOT expr                                 # exprNegate
  | expr (PIPE expr)+                        # exprConcat
  | '(' expr ')'                             # exprParenthesis
  | function=IDENTIFIER '(' (expr (COMMA expr)*)? ')' # exprFunction
  | lhs=expr (mathOp | compareOp | logicOp) rhs=expr  # exprBinOp
  | expr IS (NOT)? NULL                      # exprNull
  | (NOT)? EXIST '(' expr ')'                # exprExist
  | CASE WHEN cond=expr THEN thenValue=expr ELSE elseValue=expr END   # exprWhen
  | expr IN expr   # exprIn
  ;

// note that for the column one we should not recuycle th earlier selectColumnClause because
// that's recursive and we want to keep unit as the base case IMO (not a concrete pattern yet)
unitExpr
  : (relation=IDENTIFIER '.')? (column=IDENTIFIER | STAR)       # unitExprColumn
  | '(' selectQuery ')'  # unitExprSubQuery // check to make sure it's a single value
  | value                    # unitExprValue
  ;

selectColumnClause
  : expr (AS IDENTIFIER)?
  // # selectClauseSpecific
  // | (IDENTIFIER '.')? STAR # selectClauseAll
  ;


value
  : NUMBER # valueNumber
  | STRING # valueString
  ;

mathOp
  : '+' 
  | '-' 
  | '*' 
  | '/' 
  ;

// still need to do has, exists etc.
compareOp
  : '='     
  | '!='    
  | '>='    
  | '>'     
  | '<='
  | '<'     
  ;

logicOp
  : AND
  | OR
  ;


INPUT: 'INPUT' | 'input';
CROSSFILTER: 'CROSSFILTER' | 'crossfilter';
PREDICATE : 'PREDICATE' | 'predicate';
CONSTRAIN: 'CONSTRAIN' | 'constrain';
TEMPLATE: 'TEMPLATE' | 'template';
USE: 'USE' | 'use';
XCHART: 'XCHART' | 'xchart';
NAME: 'NAME' | 'name';
PUBLIC: 'PUBLIC' | 'public';
SINGLE: 'SINGLE' | 'single';
LINE: 'LINE' | 'line';
DYNAMIC: 'DYNAMIC' | 'dynamic';
REGISTER: 'REGISTER' | 'register';
TYPE: 'TYPE' | 'type';
UDF: 'UDF' | 'udf';
WEBWORKER: 'WEBWORKER' | 'webworker' | 'WebWorker';

// SQL
CREATE: 'CREATE' | 'create';
EXCEPT: 'EXCEPT' | 'except';
ALL: 'ALL' | 'all';
DROP: 'DROP' | 'drop';
CHECK: 'CHECK' | 'check';
UNIQUE: 'UNIQUE' | 'unique';
PRIMARY: 'PRIMARY' | 'primary';
FOREIGN: 'FOREIGN' | 'foreign';
REFERENCES: 'REFERENCES' | 'references';
KEY: 'KEY' | 'key';
TABLE: 'TABLE' | 'table';
VIEW: 'VIEW' | 'view';
INT: 'NUMBER' | 'number' | 'INTEGER' | 'integer' | 'INT' | 'int';
TEXT: 'STRING' | 'string' | 'TEXT' | 'text';
BOOLEAN: 'BOOLEAN' | 'boolean';
OUTPUT: 'OUTPUT' | 'output';
PROGRAM: 'PROGRAM' | 'program';
AFTER: 'AFTER' | 'after';
BEGIN: 'BEGIN' | 'begin';
END: 'END' | 'end';
WITH: 'WITH' | 'with';
INSERT: 'INSERT' | 'insert';
INTO: 'INTO' | 'into';
STAR: '*';
COMMA: ',';
PIPE: '||';
VALUES: 'VALUES' | 'values';
AS: 'AS' | 'as';
SELECT: 'SELECT' | 'select';
FROM: 'FROM' | 'from';
JOIN: 'JOIN' | 'join';
ON: 'ON' | 'on';
WHERE: 'WHERE' | 'where';
LIMIT: 'LIMIT' | 'limit';
EXIST: 'EXIST' | 'exist';
GROUP: 'GROUP' | 'group';
BY: 'BY' | 'by';
HAVING: 'HAVING' | 'having';
AND: 'AND' | 'and';
OR: 'OR' | 'or';
IN: 'IN' | 'in';
MINUS: '-';
DELIM: ';';
INTERSECT : 'INTERSECT' | 'intersect';
UNION: 'UNION' | 'union';
LEFT: 'LEFT' | 'left';
OUTER: 'OUTER' | 'outer';
CASE: 'CASE' | 'case';
WHEN: 'WHEN' | 'when';
THEN: 'THEN' | 'then';
ELSE: 'ELSE' | 'else';
IS: 'IS' | 'is';
NULL: 'NULL' | 'null';
NOT: 'NOT' | 'not';
ORDER: 'ORDER' | 'order';
ASC: 'ASC' | 'asc';
DESC: 'DESC' | 'desc';

fragment DIGIT
  : [0-9]
  ;

fragment LETTER
  : [A-Z]
  | [a-z]
  ;

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
  | '{' (LETTER | DIGIT | '_')+ '}'
  ;

// TEMPLATE_VARIABLE
//   : ;

WS
  : (' ' | '\t' | '\r'| '\n' | EOF ) -> channel(HIDDEN)
  ;