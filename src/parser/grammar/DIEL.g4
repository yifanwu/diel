grammar DIEL;

queries : (
           viewStmt
           | programStmt
           | crossfilterStmt
           | templateStmt
           | insertQuery
           //  the rest does not require templating
           | originalTableStmt
           | registerTypeUdf
           | dropQuery
           | deleteStmt
          )+;

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
  : INT | TEXT | BOOLEAN | DATETIME
  ;

columnDefinition
  : columnName=IDENTIFIER dataType
      columnConstraints*
      (DEFAULT (singleValue=value | function=IDENTIFIER '(' (value (COMMA value)*)? ')'))?
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
  : ((REGISTER TABLE) | CREATE (EVENT)? TABLE) IDENTIFIER relationDefintion DELIM
  ;

relationDefintion
  :  '(' (columnDefinition (',' columnDefinition)* (',' constraintDefinition)*)? ')' # relationDefintionDirect
  | AS IDENTIFIER # relationDefintionCopy
  ;

constraintClause
  :  CONSTRAIN constraintDefinition (',' constraintDefinition)*
  ;

columnConstraints
  : UNIQUE
  | PRIMARY KEY
  | NOT NULL
  | AUTOINCREMENT
  ;

viewStmt
  : CREATE (((EVENT)? VIEW) | OUTPUT (CACHED)? | TABLE) IDENTIFIER AS selectQuery
    (constraintClause)?
    DELIM
  ;

programStmt
  // : CREATE PROGRAM programBody ';'                  # programStmtGeneral
  : CREATE PROGRAM AFTER '(' IDENTIFIER (',' IDENTIFIER)* ')' programBody ';' 
  // # programStmtSpecific
  ;

// defining aProgram so that we can retrieve the order of the specification
programBody
  : BEGIN aProgram+ END
  ;

aProgram
  : insertQuery 
  | selectQuery
  | deleteStmt
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

deleteStmt
  : DELETE FROM IDENTIFIER (WHERE expr)? ';';

variableAssignment
  : variable=IDENTIFIER '=' assignment=STRING
  ;

compositeSelect
  : setOp selectUnitQuery
  ;

setOp
  : UNION
  | INTERSECT
  // | UNION ALL 
  // | EXCEPT
  ;

selectUnitQuery
  : SELECT (DISTINCT)?
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
    ('(' column=IDENTIFIER (',' column=IDENTIFIER)* ')')?
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
  : (LATEST?) relation=IDENTIFIER (AS? alias=IDENTIFIER)? # relationReferenceSimple
  | '(' selectQuery ')' (AS? alias=IDENTIFIER)? # relationReferenceSubQuery
  ;

expr
  : unitExpr                                 # exprSimple
  | NOT expr                                 # exprNegate
  | expr (PIPE expr)+                        # exprConcat
  | '(' expr ')'                             # exprParenthesis
  | function=IDENTIFIER '(' (expr (COMMA expr)*)? ')' # exprFunction
  | lhs=expr (mathOp | compareOp | logicOp) rhs=expr  # exprBinOp
  | expr IS NULL                      # exprNull
  | expr NOT NULL                     # exprNotNull
  | (NOT)? EXIST '(' expr ')'                # exprExist
  | CASE WHEN cond=expr THEN thenValue=expr ELSE elseValue=expr END   # exprWhen
  | expr IN expr   # exprIn
  ;

// note that for the column one we should not recuycle th earlier selectColumnClause because
// that's recursive and we want to keep unit as the base case IMO (not a concrete pattern yet)
unitExpr
  : (relation=IDENTIFIER '.')? (column=IDENTIFIER | STAR) # unitExprColumn
  | '(' selectQuery ')'                                   # unitExprSubQuery // check to make sure it's a single value
  | value                                                 # unitExprValue
  ;

selectColumnClause
  : expr (AS IDENTIFIER)?
  // # selectClauseSpecific
  // | (IDENTIFIER '.')? STAR # selectClauseAll
  ;


value
  : NUMBER # valueNumber
  | STRING # valueString
  | BOOLEANVAL # valueBoolean
  ;

BOOLEANVAL
  : TRUE
  | FALSE
  ;

mathOp
  : '*' 
  | '/' 
  | '%'
  | '+' 
  | '-' 
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


EVENT: E V E N T;
CROSSFILTER: C R O S S F I L T E R ;
PREDICATE : P R E D I C A T E;
CONSTRAIN: C O N S T R A I N;
TEMPLATE: T E M P L A T E;
USE: U S E;
XCHART: X C H A R T;
NAME: N A M E;
PUBLIC: P U B L I C;
SINGLE: S I N G L E;
LINE: L I N E;
DYNAMIC: D Y N A M I C;
REGISTER: R E G I S T E R;
TYPE: T Y P E;
UDF: U D F;

CREATE: C R E A T E;
DEFAULT: D E F A U L T;
EXCEPT: E X C E P T;
ALL: A L L;
DROP: D R O P;
CHECK: C H E C K;
UNIQUE: U N I Q U E;
PRIMARY: P R I M A R Y;
FOREIGN: F O R E I G N;
REFERENCES: R E F E R E N C E S;
KEY: K E Y;
TABLE: T A B L E;
VIEW: V I E W;
BOOLEAN: B O O L E A N;
OUTPUT: O U T P U T;
PROGRAM: P R O G R A M;
AFTER: A F T E R;
BEGIN: B E G I N;
END: E N D;
WITH: W I T H;
INSERT: I N S E R T;
INTO: I N T O;
VALUES: V A L U E S;
AS: A S;
SELECT: S E L E C T;
FROM: F R O M;
JOIN: J O I N;
ON: O N;
WHERE: W H E R E;
LIMIT: L I M I T;
EXIST: E X I S T;
GROUP: G R O U P;
BY: B Y;
HAVING: H A V I N G;
AND: A N D;
OR: O R;
IN: I N;
INTERSECT : I N T E R S E C T;
UNION: U N I O N;
LEFT: L E F T;
OUTER: O U T E R;
CASE: C A S E;
WHEN: W H E N;
THEN: T H E N;
ELSE: E L S E;
IS: I S;
NULL: N U L L;
NOT: N O T;
ORDER: O R D E R;
ASC: A S C;
DESC: D E S C;
AUTOINCREMENT: A U T O I N C R E M E N T;
DATETIME: D A T E T I M E;
DISTINCT: D I S T I N C T;
TRUE: T R U E;
FALSE: F A L S E;
CACHED: C A C H E D;
DELETE: D E L E T E;

INT: N U M B E R  | I N T E G E R | I N T | R E A L;
TEXT: S T R I N G | T E X T;
LATEST: L A T E S T;

MINUS: '-';
DELIM: ';';
STAR: '*';
COMMA: ',';
PIPE: '||';


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
  : MINUS? DIGIT+ ( '.' DIGIT* )?
  // (DIGIT)+
  ;

STRING
 : '\'' ( ~'\'' | '\'\'' )* '\''
 ;

IDENTIFIER
  : (LETTER | DIGIT | '_')+
  | '{' (LETTER | DIGIT | '_')+ '}'
  ;

WS
  : (' ' | '\t' | '\r'| '\n' | EOF ) -> channel(HIDDEN)
  ;

fragment A : [aA];
fragment B : [bB];
fragment C : [cC];
fragment D : [dD];
fragment E : [eE];
fragment F : [fF];
fragment G : [gG];
fragment H : [hH];
fragment I : [iI];
fragment J : [jJ];
fragment K : [kK];
fragment L : [lL];
fragment M : [mM];
fragment N : [nN];
fragment O : [oO];
fragment P : [pP];
fragment Q : [qQ];
fragment R : [rR];
fragment S : [sS];
fragment T : [tT];
fragment U : [uU];
fragment V : [vV];
fragment W : [wW];
fragment X : [xX];
fragment Y : [yY];
fragment Z : [zZ];