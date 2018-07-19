/*     
  https://github.com/apache/spark/blob/master/sql/catalyst/src/main/antlr4/org/apache/spark/sql/catalyst/parser/SqlBase.g4
*/

grammar DIEL;

@members {
  /**
   * Verify whether current token is a valid decimal token (which contains dot).
   * Returns true if the character that follows the token is not a digit or letter or underscore.
   *
   * For example:
   * For char stream "2.3", "2." is not a valid decimal token, because it is followed by digit '3'.
   * For char stream "2.3_", "2.3" is not a valid decimal token, because it is followed by '_'.
   * For char stream "2.3W", "2.3" is not a valid decimal token, because it is followed by 'W'.
   * For char stream "12.0D 34.E2+0.12 "  12.0D is a valid decimal token because it is followed
   * by a space. 34.E2 is a valid decimal token because it is followed by symbol '+'
   * which is not a digit or letter or underscore.
   */
  public boolean isValidDecimal() {
    int nextChar = _input.LA(1);
    if (nextChar >= 'A' && nextChar <= 'Z' || nextChar >= '0' && nextChar <= '9' ||
      nextChar == '_') {
      return false;
    } else {
      return true;
    }
  }
}

// note: the definitions around queries is the most complex and contains the most application logic.

queries : (query) *;

query
    : queryTerm queryOrganization      // #singleInsertQuery
    // | fromClause multiInsertQueryBody+              #multiInsertQuery
    ;

queryTerm
    : queryPrimary                                                   #queryTermDefault
    | left=queryTerm operator=(INTERSECT | UNION ) setQuantifier? right=queryTerm  #setOperation
    ;

queryPrimary
    : querySpecification              #queryPrimaryDefault
    // | TABLE tableIdentifier           #table
    | inlineTable                     #inlineTableDefault1
    | '(' query  ')'                  #subquery
    ;

querySpecification
    : SELECT namedExpressionSeq
       (AS (identifierSeq | ('(' identifierSeq ')')))?
       fromClause?
       (WHERE where=booleanExpression)?
    ;

multiInsertQueryBody
    : querySpecification queryOrganization
    ;

identifierSeq
    : identifier (',' identifier)*
    ;

namedExpression
    : expression (AS? (identifier | identifierList))?
    ;

namedExpressionSeq
    : namedExpression (',' namedExpression)*
    ;

queryOrganization
    : (ORDER BY order+=sortItem (',' order+=sortItem)*)?
      (LIMIT (ALL | limit=expression))?
    ;

sortItem
    : expression ordering=(ASC | DESC)?
    ;

fromClause
    : FROM relation (',' relation)*
    ;

relation
    : relationPrimary joinRelation*
    ;

joinRelation
    : (joinType) JOIN right=relationPrimary joinCriteria?
    | NATURAL joinType JOIN right=relationPrimary
    ;


joinType
    : INNER?
    | CROSS
    | LEFT OUTER?
    | RIGHT OUTER?
    | FULL OUTER?
    | LEFT? ANTI
    ;

relationPrimary
    : tableIdentifier tableAlias      #tableName
    | '(' query ')' tableAlias        #aliasedQuery
    | '(' relation ')' tableAlias     #aliasedRelation
    | inlineTable                     #inlineTableDefault2
    ;

inlineTable
    : VALUES expression (',' expression)* tableAlias
    ;

tableAlias
    : (AS? strictIdentifier identifierList?)?
    ;


setQuantifier
    : DISTINCT
    | ALL
    ;

joinCriteria
    : ON booleanExpression
    ;

identifierList
    : '(' identifierSeq ')'
    ;

expression
    : booleanExpression
    ;

booleanExpression
    : NOT booleanExpression                                        #logicalNot
    | EXISTS '(' query ')'                                         #exists
    | valueExpression predicate?                                   #predicated
    | left=booleanExpression operator=AND right=booleanExpression  #logicalBinary
    | left=booleanExpression operator=OR right=booleanExpression   #logicalBinary
    ;



primaryExpression
    : CASE whenClause+ (ELSE elseExpression=expression)? END                    #searchedCase
    | CASE value=expression whenClause+ (ELSE elseExpression=expression)? END   #simpleCase
    | constant                                                                  #constantDefault
    | ASTERISK                                                                  #star
    | qualifiedName '.' ASTERISK                                                #star
    | '(' namedExpression (',' namedExpression)+ ')'                            #rowConstructor
    | '(' query ')'                                                             #subqueryExpression
    | value=primaryExpression '[' index=valueExpression ']'                     #subscript
    | identifier                                                                #columnReference
    | base=primaryExpression '.' fieldName=identifier                           #dereference
    | '(' expression ')'                                                        #parenthesizedExpression
    ;

valueExpression
    : primaryExpression                                                                      #valueExpressionDefault
    | operator=(MINUS | PLUS ) valueExpression                                               #arithmeticUnary
    | left=valueExpression operator=(ASTERISK | SLASH | PERCENT | DIV) right=valueExpression #arithmeticBinary
    | left=valueExpression operator=(PLUS | MINUS | CONCAT_PIPE) right=valueExpression       #arithmeticBinary
    | left=valueExpression comparisonOperator right=valueExpression                          #comparison
    ;


predicate
    : NOT? kind=BETWEEN lower=valueExpression AND upper=valueExpression
    | NOT? kind=IN '(' expression (',' expression)* ')'
    | NOT? kind=IN '(' query ')'
    | NOT? kind=(RLIKE | LIKE) pattern=valueExpression
    | IS NOT? kind=NULL
    | IS NOT? kind=DISTINCT FROM right=valueExpression
    ;

constant
    : NULL                         #nullLiteral
    | identifier STRING            #typeConstructor
    | number                       #numericLiteral
    | booleanValue                 #booleanLiteral
    | STRING+                      #stringLiteral
    ;

whenClause
    : WHEN condition=expression THEN result=expression
    ;


qualifiedName
    : identifier ('.' identifier)*
    ;


tableIdentifier
    : (db=identifier '.')? table=identifier
    ;


identifier
    : strictIdentifier
    | ANTI | FULL | INNER | LEFT | RIGHT | NATURAL | JOIN | CROSS | ON
    | UNION 
    ;

strictIdentifier
    : IDENTIFIER             #unquotedIdentifier
    | quotedIdentifier       #quotedIdentifierAlternative
    | nonReserved            #unquotedIdentifier
    ;

quotedIdentifier
    : BACKQUOTED_IDENTIFIER
    ;

nonReserved
    : VIEW | VALUES 
    | ASC | DESC | LIMIT | ALL | ANY | AS  | BY | CREATE | EXISTS | FALSE | GROUP | IN | INSERT |  IS |LIKE
    | NULL | ORDER | OUTER | TABLE | TRUE | WITH
    | AND | DISTINCT | DIV |END | OR
    | SELECT | FROM | WHERE | HAVING |  TABLE | WITH | NOT
    ;

comparisonOperator
    : EQ | NEQ | NEQJ | LT | LTE | GT | GTE | NSEQ
    ;

arithmeticOperator
    : PLUS | MINUS | ASTERISK | SLASH | PERCENT | DIV
    ;

predicateOperator
    : OR | AND | IN | NOT
    ;

booleanValue
    : TRUE | FALSE
    ;


number
    : MINUS? DECIMAL_VALUE            #decimalLiteral
    | MINUS? INTEGER_VALUE            #integerLiteral
    ;

// special DIEL key words
STREAM: 'STREAM';
OUTPUT: 'OUTPUT';
// end DIEL
ALL: 'ALL';
CASE: 'CASE';
CAST: 'CAST';
EXISTS: 'EXISTS';
ANY: 'ANY';
AS: 'AS';
TABLE: 'TABLE';
VIEW: 'VIEW';
VALUES: 'VALUES';
CREATE: 'CREATE';
SELECT: 'SELECT';
FROM: 'FROM';
DISTINCT: 'DISTINCT';
WHERE: 'WHERE';
INSERT: 'INSERT';
GROUP: 'GROUP';
BY: 'BY';
WHEN: 'WHEN';
ELSE: 'ELSE';
THEN: 'THEN';
ORDER: 'ORDER';
HAVING: 'HAVING';
LIMIT: 'LIMIT';OR: 'OR';
AND: 'AND';
IN: 'IN';
NOT: 'NOT' | '!';
IS: 'IS';
NULL: 'NULL';
TRUE: 'TRUE';
FALSE: 'FALSE';
ASC: 'ASC';
FULL: 'FULL';
DESC: 'DESC';
JOIN: 'JOIN';
CROSS: 'CROSS';
OUTER: 'OUTER';
INNER: 'INNER';
UNION: 'UNION';
INTERSECT: 'INTERSECT';
LEFT: 'LEFT';
ON: 'ON';
NATURAL: 'NATURAL';
ANTI: 'ANTI';
WITH: 'WITH';
END: 'END';
LIKE: 'LIKE';
RIGHT: 'RIGHT';
BETWEEN: 'BETWEEN';
INTO: 'INTO';
RLIKE: 'RLIKE';
CONCAT_PIPE: '||';

EQ  : '=' | '==';
NSEQ: '<=>';
NEQ : '<>';
NEQJ: '!=';
LT  : '<';
LTE : '<=' | '!>';
GT  : '>';
GTE : '>=' | '!<';
PLUS: '+';
MINUS: '-';

ASTERISK: '*';
SLASH: '/';
PERCENT: '%';
DIV: 'DIV';

fragment DIGIT
    : [0-9]
    ;

fragment LETTER
    : [A-Z]
    ;


fragment DECIMAL_DIGITS
    : DIGIT+ '.' DIGIT*
    | '.' DIGIT+
    ;

fragment EXPONENT
    : 'E' [+-]? DIGIT+
    ;

IDENTIFIER
    : (LETTER | DIGIT | '_')+
    ;

BACKQUOTED_IDENTIFIER
    : '`' ( ~'`' | '``' )* '`'
    ;

STRING
    : '\'' ( ~('\''|'\\') | ('\\' .) )* '\''
    | '"' ( ~('"'|'\\') | ('\\' .) )* '"'
    ;

INTEGER_VALUE
    : DIGIT+
    ;


DECIMAL_VALUE
    : DIGIT+ EXPONENT
    | DECIMAL_DIGITS EXPONENT? {isValidDecimal()}?
    ;

SIMPLE_COMMENT
    : '--' ~[\r\n]* '\r'? '\n'? -> channel(HIDDEN)
    ;

// NOT going to support

// insertInto
//     : INSERT INTO TABLE? tableIdentifier   #insertIntoTable
//     ;
