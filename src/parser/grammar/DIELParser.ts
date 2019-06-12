// Generated from src/parser/grammar/DIEL.g4 by ANTLR 4.6-SNAPSHOT


import { ATN } from 'antlr4ts/atn/ATN';
import { ATNDeserializer } from 'antlr4ts/atn/ATNDeserializer';
import { FailedPredicateException } from 'antlr4ts/FailedPredicateException';
import { NotNull } from 'antlr4ts/Decorators';
import { NoViableAltException } from 'antlr4ts/NoViableAltException';
import { Override } from 'antlr4ts/Decorators';
import { Parser } from 'antlr4ts/Parser';
import { ParserRuleContext } from 'antlr4ts/ParserRuleContext';
import { ParserATNSimulator } from 'antlr4ts/atn/ParserATNSimulator';
import { ParseTreeListener } from 'antlr4ts/tree/ParseTreeListener';
import { ParseTreeVisitor } from 'antlr4ts/tree/ParseTreeVisitor';
import { RecognitionException } from 'antlr4ts/RecognitionException';
import { RuleContext } from 'antlr4ts/RuleContext';
import { RuleVersion } from 'antlr4ts/RuleVersion';
import { TerminalNode } from 'antlr4ts/tree/TerminalNode';
import { Token } from 'antlr4ts/Token';
import { TokenStream } from 'antlr4ts/TokenStream';
import { Vocabulary } from 'antlr4ts/Vocabulary';
import { VocabularyImpl } from 'antlr4ts/VocabularyImpl';

import * as Utils from 'antlr4ts/misc/Utils';

import { DIELVisitor } from './DIELVisitor';


export class DIELParser extends Parser {
	public static readonly T__0=1;
	public static readonly T__1=2;
	public static readonly T__2=3;
	public static readonly T__3=4;
	public static readonly T__4=5;
	public static readonly T__5=6;
	public static readonly T__6=7;
	public static readonly T__7=8;
	public static readonly T__8=9;
	public static readonly T__9=10;
	public static readonly T__10=11;
	public static readonly T__11=12;
	public static readonly BOOLEANVAL=13;
	public static readonly EVENT=14;
	public static readonly CROSSFILTER=15;
	public static readonly LINK=16;
	public static readonly PREDICATE=17;
	public static readonly CONSTRAIN=18;
	public static readonly TEMPLATE=19;
	public static readonly FILTER=20;
	public static readonly FACTORS=21;
	public static readonly MEASURING=22;
	public static readonly SELECTION=23;
	public static readonly USE=24;
	public static readonly XCHART=25;
	public static readonly NAME=26;
	public static readonly PUBLIC=27;
	public static readonly SINGLE=28;
	public static readonly LINE=29;
	public static readonly DYNAMIC=30;
	public static readonly REGISTER=31;
	public static readonly TYPE=32;
	public static readonly UDF=33;
	public static readonly CREATE=34;
	public static readonly DEFAULT=35;
	public static readonly EXCEPT=36;
	public static readonly ALL=37;
	public static readonly DROP=38;
	public static readonly CHECK=39;
	public static readonly UNIQUE=40;
	public static readonly PRIMARY=41;
	public static readonly FOREIGN=42;
	public static readonly REFERENCES=43;
	public static readonly KEY=44;
	public static readonly TABLE=45;
	public static readonly VIEW=46;
	public static readonly BOOLEAN=47;
	public static readonly OUTPUT=48;
	public static readonly PROGRAM=49;
	public static readonly AFTER=50;
	public static readonly BEGIN=51;
	public static readonly END=52;
	public static readonly WITH=53;
	public static readonly INSERT=54;
	public static readonly INTO=55;
	public static readonly VALUES=56;
	public static readonly AS=57;
	public static readonly SELECT=58;
	public static readonly FROM=59;
	public static readonly NATURAL=60;
	public static readonly JOIN=61;
	public static readonly ON=62;
	public static readonly WHERE=63;
	public static readonly LIMIT=64;
	public static readonly EXIST=65;
	public static readonly GROUP=66;
	public static readonly BY=67;
	public static readonly HAVING=68;
	public static readonly AND=69;
	public static readonly OR=70;
	public static readonly IN=71;
	public static readonly INTERSECT=72;
	public static readonly UNION=73;
	public static readonly LEFT=74;
	public static readonly OUTER=75;
	public static readonly CASE=76;
	public static readonly WHEN=77;
	public static readonly THEN=78;
	public static readonly ELSE=79;
	public static readonly IS=80;
	public static readonly NULL=81;
	public static readonly NOT=82;
	public static readonly ORDER=83;
	public static readonly ASC=84;
	public static readonly DESC=85;
	public static readonly AUTOINCREMENT=86;
	public static readonly DATETIME=87;
	public static readonly DISTINCT=88;
	public static readonly TRUE=89;
	public static readonly FALSE=90;
	public static readonly CACHED=91;
	public static readonly DELETE=92;
	public static readonly INT=93;
	public static readonly TEXT=94;
	public static readonly LATEST=95;
	public static readonly MINUS=96;
	public static readonly DELIM=97;
	public static readonly STAR=98;
	public static readonly COMMA=99;
	public static readonly PIPE=100;
	public static readonly SIMPLE_COMMENT=101;
	public static readonly NUMBER=102;
	public static readonly STRING=103;
	public static readonly IDENTIFIER=104;
	public static readonly WS=105;
	public static readonly RULE_queries = 0;
	public static readonly RULE_registerTypeUdf = 1;
	public static readonly RULE_templateStmt = 2;
	public static readonly RULE_dataType = 3;
	public static readonly RULE_columnDefinition = 4;
	public static readonly RULE_constraintDefinition = 5;
	public static readonly RULE_originalTableStmt = 6;
	public static readonly RULE_relationDefintion = 7;
	public static readonly RULE_constraintClause = 8;
	public static readonly RULE_columnConstraints = 9;
	public static readonly RULE_viewStmt = 10;
	public static readonly RULE_programStmt = 11;
	public static readonly RULE_programBody = 12;
	public static readonly RULE_aProgram = 13;
	public static readonly RULE_selectQuery = 14;
	public static readonly RULE_templateQuery = 15;
	public static readonly RULE_dropQuery = 16;
	public static readonly RULE_deleteStmt = 17;
	public static readonly RULE_variableAssignment = 18;
	public static readonly RULE_compositeSelect = 19;
	public static readonly RULE_setOp = 20;
	public static readonly RULE_selectUnitQuery = 21;
	public static readonly RULE_whereClause = 22;
	public static readonly RULE_groupByClause = 23;
	public static readonly RULE_havingClause = 24;
	public static readonly RULE_orderByClause = 25;
	public static readonly RULE_orderSpec = 26;
	public static readonly RULE_insertQuery = 27;
	public static readonly RULE_insertBody = 28;
	public static readonly RULE_joinClause = 29;
	public static readonly RULE_limitClause = 30;
	public static readonly RULE_relationReference = 31;
	public static readonly RULE_expr = 32;
	public static readonly RULE_unitExpr = 33;
	public static readonly RULE_selectColumnClause = 34;
	public static readonly RULE_value = 35;
	public static readonly RULE_mathOp = 36;
	public static readonly RULE_compareOp = 37;
	public static readonly RULE_logicOp = 38;
	public static readonly ruleNames: string[] = [
		"queries", "registerTypeUdf", "templateStmt", "dataType", "columnDefinition", 
		"constraintDefinition", "originalTableStmt", "relationDefintion", "constraintClause", 
		"columnConstraints", "viewStmt", "programStmt", "programBody", "aProgram", 
		"selectQuery", "templateQuery", "dropQuery", "deleteStmt", "variableAssignment", 
		"compositeSelect", "setOp", "selectUnitQuery", "whereClause", "groupByClause", 
		"havingClause", "orderByClause", "orderSpec", "insertQuery", "insertBody", 
		"joinClause", "limitClause", "relationReference", "expr", "unitExpr", 
		"selectColumnClause", "value", "mathOp", "compareOp", "logicOp"
	];

	private static readonly _LITERAL_NAMES: (string | undefined)[] = [
		undefined, "'('", "')'", "'='", "'.'", "'/'", "'%'", "'+'", "'!='", "'>='", 
		"'>'", "'<='", "'<'", undefined, undefined, undefined, undefined, undefined, 
		undefined, undefined, undefined, undefined, undefined, undefined, undefined, 
		undefined, undefined, undefined, undefined, undefined, undefined, undefined, 
		undefined, undefined, undefined, undefined, undefined, undefined, undefined, 
		undefined, undefined, undefined, undefined, undefined, undefined, undefined, 
		undefined, undefined, undefined, undefined, undefined, undefined, undefined, 
		undefined, undefined, undefined, undefined, undefined, undefined, undefined, 
		undefined, undefined, undefined, undefined, undefined, undefined, undefined, 
		undefined, undefined, undefined, undefined, undefined, undefined, undefined, 
		undefined, undefined, undefined, undefined, undefined, undefined, undefined, 
		undefined, undefined, undefined, undefined, undefined, undefined, undefined, 
		undefined, undefined, undefined, undefined, undefined, undefined, undefined, 
		undefined, "'-'", "';'", "'*'", "','", "'||'"
	];
	private static readonly _SYMBOLIC_NAMES: (string | undefined)[] = [
		undefined, undefined, undefined, undefined, undefined, undefined, undefined, 
		undefined, undefined, undefined, undefined, undefined, undefined, "BOOLEANVAL", 
		"EVENT", "CROSSFILTER", "LINK", "PREDICATE", "CONSTRAIN", "TEMPLATE", 
		"FILTER", "FACTORS", "MEASURING", "SELECTION", "USE", "XCHART", "NAME", 
		"PUBLIC", "SINGLE", "LINE", "DYNAMIC", "REGISTER", "TYPE", "UDF", "CREATE", 
		"DEFAULT", "EXCEPT", "ALL", "DROP", "CHECK", "UNIQUE", "PRIMARY", "FOREIGN", 
		"REFERENCES", "KEY", "TABLE", "VIEW", "BOOLEAN", "OUTPUT", "PROGRAM", 
		"AFTER", "BEGIN", "END", "WITH", "INSERT", "INTO", "VALUES", "AS", "SELECT", 
		"FROM", "NATURAL", "JOIN", "ON", "WHERE", "LIMIT", "EXIST", "GROUP", "BY", 
		"HAVING", "AND", "OR", "IN", "INTERSECT", "UNION", "LEFT", "OUTER", "CASE", 
		"WHEN", "THEN", "ELSE", "IS", "NULL", "NOT", "ORDER", "ASC", "DESC", "AUTOINCREMENT", 
		"DATETIME", "DISTINCT", "TRUE", "FALSE", "CACHED", "DELETE", "INT", "TEXT", 
		"LATEST", "MINUS", "DELIM", "STAR", "COMMA", "PIPE", "SIMPLE_COMMENT", 
		"NUMBER", "STRING", "IDENTIFIER", "WS"
	];
	public static readonly VOCABULARY: Vocabulary = new VocabularyImpl(DIELParser._LITERAL_NAMES, DIELParser._SYMBOLIC_NAMES, []);

	@Override
	@NotNull
	public get vocabulary(): Vocabulary {
		return DIELParser.VOCABULARY;
	}

	@Override
	public get grammarFileName(): string { return "DIEL.g4"; }

	@Override
	public get ruleNames(): string[] { return DIELParser.ruleNames; }

	@Override
	public get serializedATN(): string { return DIELParser._serializedATN; }

	constructor(input: TokenStream) {
		super(input);
		this._interp = new ParserATNSimulator(DIELParser._ATN, this);
	}
	@RuleVersion(0)
	public queries(): QueriesContext {
		let _localctx: QueriesContext = new QueriesContext(this._ctx, this.state);
		this.enterRule(_localctx, 0, DIELParser.RULE_queries);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 86; 
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			do {
				{
				this.state = 86;
				this._errHandler.sync(this);
				switch ( this.interpreter.adaptivePredict(this._input,0,this._ctx) ) {
				case 1:
					{
					this.state = 78;
					this.viewStmt();
					}
					break;

				case 2:
					{
					this.state = 79;
					this.programStmt();
					}
					break;

				case 3:
					{
					this.state = 80;
					this.templateStmt();
					}
					break;

				case 4:
					{
					this.state = 81;
					this.insertQuery();
					}
					break;

				case 5:
					{
					this.state = 82;
					this.originalTableStmt();
					}
					break;

				case 6:
					{
					this.state = 83;
					this.registerTypeUdf();
					}
					break;

				case 7:
					{
					this.state = 84;
					this.dropQuery();
					}
					break;

				case 8:
					{
					this.state = 85;
					this.deleteStmt();
					}
					break;
				}
				}
				this.state = 88; 
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			} while ( ((((_la - 31)) & ~0x1F) === 0 && ((1 << (_la - 31)) & ((1 << (DIELParser.REGISTER - 31)) | (1 << (DIELParser.CREATE - 31)) | (1 << (DIELParser.DROP - 31)) | (1 << (DIELParser.INSERT - 31)))) !== 0) || _la===DIELParser.DELETE );
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public registerTypeUdf(): RegisterTypeUdfContext {
		let _localctx: RegisterTypeUdfContext = new RegisterTypeUdfContext(this._ctx, this.state);
		this.enterRule(_localctx, 2, DIELParser.RULE_registerTypeUdf);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 90;
			this.match(DIELParser.REGISTER);
			this.state = 91;
			this.match(DIELParser.UDF);
			this.state = 92;
			this.match(DIELParser.IDENTIFIER);
			this.state = 93;
			this.match(DIELParser.TYPE);
			this.state = 94;
			this.dataType();
			this.state = 95;
			this.match(DIELParser.DELIM);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public templateStmt(): TemplateStmtContext {
		let _localctx: TemplateStmtContext = new TemplateStmtContext(this._ctx, this.state);
		this.enterRule(_localctx, 4, DIELParser.RULE_templateStmt);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 97;
			this.match(DIELParser.CREATE);
			this.state = 98;
			this.match(DIELParser.TEMPLATE);
			this.state = 99;
			_localctx._templateName = this.match(DIELParser.IDENTIFIER);
			this.state = 100;
			this.match(DIELParser.T__0);
			this.state = 101;
			this.match(DIELParser.IDENTIFIER);
			this.state = 106;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la===DIELParser.COMMA) {
				{
				{
				this.state = 102;
				this.match(DIELParser.COMMA);
				this.state = 103;
				this.match(DIELParser.IDENTIFIER);
				}
				}
				this.state = 108;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 109;
			this.match(DIELParser.T__1);
			this.state = 112;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input,3,this._ctx) ) {
			case 1:
				{
				this.state = 110;
				this.selectQuery();
				}
				break;

			case 2:
				{
				this.state = 111;
				this.joinClause();
				}
				break;
			}
			this.state = 114;
			this.match(DIELParser.DELIM);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public dataType(): DataTypeContext {
		let _localctx: DataTypeContext = new DataTypeContext(this._ctx, this.state);
		this.enterRule(_localctx, 6, DIELParser.RULE_dataType);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 116;
			_la = this._input.LA(1);
			if ( !(_la===DIELParser.BOOLEAN || ((((_la - 87)) & ~0x1F) === 0 && ((1 << (_la - 87)) & ((1 << (DIELParser.DATETIME - 87)) | (1 << (DIELParser.INT - 87)) | (1 << (DIELParser.TEXT - 87)))) !== 0)) ) {
			this._errHandler.recoverInline(this);
			} else {
				if (this._input.LA(1) === Token.EOF) {
					this.matchedEOF = true;
				}

				this._errHandler.reportMatch(this);
				this.consume();
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public columnDefinition(): ColumnDefinitionContext {
		let _localctx: ColumnDefinitionContext = new ColumnDefinitionContext(this._ctx, this.state);
		this.enterRule(_localctx, 8, DIELParser.RULE_columnDefinition);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 118;
			_localctx._columnName = this.match(DIELParser.IDENTIFIER);
			this.state = 119;
			this.dataType();
			this.state = 123;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la===DIELParser.UNIQUE || _la===DIELParser.PRIMARY || _la===DIELParser.NOT || _la===DIELParser.AUTOINCREMENT) {
				{
				{
				this.state = 120;
				this.columnConstraints();
				}
				}
				this.state = 125;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 143;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la===DIELParser.DEFAULT) {
				{
				this.state = 126;
				this.match(DIELParser.DEFAULT);
				this.state = 141;
				this._errHandler.sync(this);
				switch (this._input.LA(1)) {
				case DIELParser.BOOLEANVAL:
				case DIELParser.NUMBER:
				case DIELParser.STRING:
					{
					this.state = 127;
					_localctx._singleValue = this.value();
					}
					break;
				case DIELParser.IDENTIFIER:
					{
					this.state = 128;
					_localctx._function = this.match(DIELParser.IDENTIFIER);
					this.state = 129;
					this.match(DIELParser.T__0);
					this.state = 138;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
					if (_la===DIELParser.BOOLEANVAL || _la===DIELParser.NUMBER || _la===DIELParser.STRING) {
						{
						this.state = 130;
						this.value();
						this.state = 135;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
						while (_la===DIELParser.COMMA) {
							{
							{
							this.state = 131;
							this.match(DIELParser.COMMA);
							this.state = 132;
							this.value();
							}
							}
							this.state = 137;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
						}
						}
					}

					this.state = 140;
					this.match(DIELParser.T__1);
					}
					break;
				default:
					throw new NoViableAltException(this);
				}
				}
			}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public constraintDefinition(): ConstraintDefinitionContext {
		let _localctx: ConstraintDefinitionContext = new ConstraintDefinitionContext(this._ctx, this.state);
		this.enterRule(_localctx, 10, DIELParser.RULE_constraintDefinition);
		let _la: number;
		try {
			this.state = 185;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case DIELParser.PRIMARY:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 145;
				this.match(DIELParser.PRIMARY);
				this.state = 146;
				this.match(DIELParser.KEY);
				this.state = 147;
				this.match(DIELParser.T__0);
				this.state = 148;
				this.match(DIELParser.IDENTIFIER);
				this.state = 153;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while (_la===DIELParser.COMMA) {
					{
					{
					this.state = 149;
					this.match(DIELParser.COMMA);
					this.state = 150;
					this.match(DIELParser.IDENTIFIER);
					}
					}
					this.state = 155;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				this.state = 156;
				this.match(DIELParser.T__1);
				}
				break;
			case DIELParser.UNIQUE:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 157;
				this.match(DIELParser.UNIQUE);
				this.state = 158;
				this.match(DIELParser.T__0);
				this.state = 159;
				this.match(DIELParser.IDENTIFIER);
				this.state = 164;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while (_la===DIELParser.COMMA) {
					{
					{
					this.state = 160;
					this.match(DIELParser.COMMA);
					this.state = 161;
					this.match(DIELParser.IDENTIFIER);
					}
					}
					this.state = 166;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				this.state = 167;
				this.match(DIELParser.T__1);
				}
				break;
			case DIELParser.IDENTIFIER:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 168;
				this.match(DIELParser.IDENTIFIER);
				this.state = 169;
				this.match(DIELParser.NOT);
				this.state = 170;
				this.match(DIELParser.NULL);
				}
				break;
			case DIELParser.FOREIGN:
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 171;
				this.match(DIELParser.FOREIGN);
				this.state = 172;
				this.match(DIELParser.KEY);
				this.state = 173;
				this.match(DIELParser.T__0);
				this.state = 174;
				_localctx._column = this.match(DIELParser.IDENTIFIER);
				this.state = 175;
				this.match(DIELParser.T__1);
				this.state = 176;
				this.match(DIELParser.REFERENCES);
				this.state = 177;
				_localctx._table = this.match(DIELParser.IDENTIFIER);
				this.state = 178;
				this.match(DIELParser.T__0);
				this.state = 179;
				_localctx._otherColumn = this.match(DIELParser.IDENTIFIER);
				this.state = 180;
				this.match(DIELParser.T__1);
				}
				break;
			case DIELParser.SINGLE:
				this.enterOuterAlt(_localctx, 5);
				{
				this.state = 181;
				this.match(DIELParser.SINGLE);
				this.state = 182;
				this.match(DIELParser.LINE);
				}
				break;
			case DIELParser.CHECK:
				this.enterOuterAlt(_localctx, 6);
				{
				this.state = 183;
				this.match(DIELParser.CHECK);
				{
				this.state = 184;
				this.expr(0);
				}
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public originalTableStmt(): OriginalTableStmtContext {
		let _localctx: OriginalTableStmtContext = new OriginalTableStmtContext(this._ctx, this.state);
		this.enterRule(_localctx, 12, DIELParser.RULE_originalTableStmt);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 194;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case DIELParser.REGISTER:
				{
				{
				this.state = 187;
				this.match(DIELParser.REGISTER);
				this.state = 188;
				this.match(DIELParser.TABLE);
				}
				}
				break;
			case DIELParser.CREATE:
				{
				this.state = 189;
				this.match(DIELParser.CREATE);
				this.state = 191;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===DIELParser.EVENT) {
					{
					this.state = 190;
					this.match(DIELParser.EVENT);
					}
				}

				this.state = 193;
				this.match(DIELParser.TABLE);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
			this.state = 196;
			this.match(DIELParser.IDENTIFIER);
			this.state = 197;
			this.relationDefintion();
			this.state = 198;
			this.match(DIELParser.DELIM);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public relationDefintion(): RelationDefintionContext {
		let _localctx: RelationDefintionContext = new RelationDefintionContext(this._ctx, this.state);
		this.enterRule(_localctx, 14, DIELParser.RULE_relationDefintion);
		let _la: number;
		try {
			let _alt: number;
			this.state = 221;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case DIELParser.T__0:
				_localctx = new RelationDefintionDirectContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 200;
				this.match(DIELParser.T__0);
				this.state = 216;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===DIELParser.IDENTIFIER) {
					{
					this.state = 201;
					this.columnDefinition();
					this.state = 206;
					this._errHandler.sync(this);
					_alt = this.interpreter.adaptivePredict(this._input,14,this._ctx);
					while ( _alt!==2 && _alt!==ATN.INVALID_ALT_NUMBER ) {
						if ( _alt===1 ) {
							{
							{
							this.state = 202;
							this.match(DIELParser.COMMA);
							this.state = 203;
							this.columnDefinition();
							}
							} 
						}
						this.state = 208;
						this._errHandler.sync(this);
						_alt = this.interpreter.adaptivePredict(this._input,14,this._ctx);
					}
					this.state = 213;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
					while (_la===DIELParser.COMMA) {
						{
						{
						this.state = 209;
						this.match(DIELParser.COMMA);
						this.state = 210;
						this.constraintDefinition();
						}
						}
						this.state = 215;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
					}
					}
				}

				this.state = 218;
				this.match(DIELParser.T__1);
				}
				break;
			case DIELParser.AS:
				_localctx = new RelationDefintionCopyContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 219;
				this.match(DIELParser.AS);
				this.state = 220;
				this.match(DIELParser.IDENTIFIER);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public constraintClause(): ConstraintClauseContext {
		let _localctx: ConstraintClauseContext = new ConstraintClauseContext(this._ctx, this.state);
		this.enterRule(_localctx, 16, DIELParser.RULE_constraintClause);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 223;
			this.match(DIELParser.CONSTRAIN);
			this.state = 224;
			this.constraintDefinition();
			this.state = 229;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la===DIELParser.COMMA) {
				{
				{
				this.state = 225;
				this.match(DIELParser.COMMA);
				this.state = 226;
				this.constraintDefinition();
				}
				}
				this.state = 231;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public columnConstraints(): ColumnConstraintsContext {
		let _localctx: ColumnConstraintsContext = new ColumnConstraintsContext(this._ctx, this.state);
		this.enterRule(_localctx, 18, DIELParser.RULE_columnConstraints);
		try {
			this.state = 238;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case DIELParser.UNIQUE:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 232;
				this.match(DIELParser.UNIQUE);
				}
				break;
			case DIELParser.PRIMARY:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 233;
				this.match(DIELParser.PRIMARY);
				this.state = 234;
				this.match(DIELParser.KEY);
				}
				break;
			case DIELParser.NOT:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 235;
				this.match(DIELParser.NOT);
				this.state = 236;
				this.match(DIELParser.NULL);
				}
				break;
			case DIELParser.AUTOINCREMENT:
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 237;
				this.match(DIELParser.AUTOINCREMENT);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public viewStmt(): ViewStmtContext {
		let _localctx: ViewStmtContext = new ViewStmtContext(this._ctx, this.state);
		this.enterRule(_localctx, 20, DIELParser.RULE_viewStmt);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 240;
			this.match(DIELParser.CREATE);
			this.state = 250;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case DIELParser.EVENT:
			case DIELParser.VIEW:
				{
				{
				this.state = 242;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===DIELParser.EVENT) {
					{
					this.state = 241;
					this.match(DIELParser.EVENT);
					}
				}

				this.state = 244;
				this.match(DIELParser.VIEW);
				}
				}
				break;
			case DIELParser.OUTPUT:
				{
				this.state = 245;
				this.match(DIELParser.OUTPUT);
				this.state = 247;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===DIELParser.CACHED) {
					{
					this.state = 246;
					this.match(DIELParser.CACHED);
					}
				}

				}
				break;
			case DIELParser.TABLE:
				{
				this.state = 249;
				this.match(DIELParser.TABLE);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
			this.state = 252;
			this.match(DIELParser.IDENTIFIER);
			this.state = 253;
			this.match(DIELParser.AS);
			this.state = 254;
			this.selectQuery();
			this.state = 256;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la===DIELParser.CONSTRAIN) {
				{
				this.state = 255;
				this.constraintClause();
				}
			}

			this.state = 258;
			this.match(DIELParser.DELIM);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public programStmt(): ProgramStmtContext {
		let _localctx: ProgramStmtContext = new ProgramStmtContext(this._ctx, this.state);
		this.enterRule(_localctx, 22, DIELParser.RULE_programStmt);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 260;
			this.match(DIELParser.CREATE);
			this.state = 261;
			this.match(DIELParser.PROGRAM);
			this.state = 262;
			this.match(DIELParser.AFTER);
			this.state = 263;
			this.match(DIELParser.T__0);
			this.state = 264;
			this.match(DIELParser.IDENTIFIER);
			this.state = 269;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la===DIELParser.COMMA) {
				{
				{
				this.state = 265;
				this.match(DIELParser.COMMA);
				this.state = 266;
				this.match(DIELParser.IDENTIFIER);
				}
				}
				this.state = 271;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 272;
			this.match(DIELParser.T__1);
			this.state = 273;
			this.programBody();
			this.state = 274;
			this.match(DIELParser.DELIM);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public programBody(): ProgramBodyContext {
		let _localctx: ProgramBodyContext = new ProgramBodyContext(this._ctx, this.state);
		this.enterRule(_localctx, 24, DIELParser.RULE_programBody);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 276;
			this.match(DIELParser.BEGIN);
			this.state = 278; 
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			do {
				{
				{
				this.state = 277;
				this.aProgram();
				}
				}
				this.state = 280; 
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			} while ( _la===DIELParser.USE || _la===DIELParser.INSERT || _la===DIELParser.SELECT || _la===DIELParser.DELETE );
			this.state = 282;
			this.match(DIELParser.END);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public aProgram(): AProgramContext {
		let _localctx: AProgramContext = new AProgramContext(this._ctx, this.state);
		this.enterRule(_localctx, 26, DIELParser.RULE_aProgram);
		try {
			this.state = 287;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case DIELParser.INSERT:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 284;
				this.insertQuery();
				}
				break;
			case DIELParser.USE:
			case DIELParser.SELECT:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 285;
				this.selectQuery();
				}
				break;
			case DIELParser.DELETE:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 286;
				this.deleteStmt();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public selectQuery(): SelectQueryContext {
		let _localctx: SelectQueryContext = new SelectQueryContext(this._ctx, this.state);
		this.enterRule(_localctx, 28, DIELParser.RULE_selectQuery);
		let _la: number;
		try {
			this.state = 297;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case DIELParser.SELECT:
				_localctx = new SelectQueryDirectContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 289;
				this.selectUnitQuery();
				this.state = 293;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while (_la===DIELParser.INTERSECT || _la===DIELParser.UNION) {
					{
					{
					this.state = 290;
					this.compositeSelect();
					}
					}
					this.state = 295;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				}
				break;
			case DIELParser.USE:
				_localctx = new SelectQueryTemplateContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 296;
				this.templateQuery();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public templateQuery(): TemplateQueryContext {
		let _localctx: TemplateQueryContext = new TemplateQueryContext(this._ctx, this.state);
		this.enterRule(_localctx, 30, DIELParser.RULE_templateQuery);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 299;
			this.match(DIELParser.USE);
			this.state = 300;
			this.match(DIELParser.TEMPLATE);
			this.state = 301;
			_localctx._templateName = this.match(DIELParser.IDENTIFIER);
			this.state = 302;
			this.match(DIELParser.T__0);
			this.state = 303;
			this.variableAssignment();
			this.state = 308;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la===DIELParser.COMMA) {
				{
				{
				this.state = 304;
				this.match(DIELParser.COMMA);
				this.state = 305;
				this.variableAssignment();
				}
				}
				this.state = 310;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 311;
			this.match(DIELParser.T__1);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public dropQuery(): DropQueryContext {
		let _localctx: DropQueryContext = new DropQueryContext(this._ctx, this.state);
		this.enterRule(_localctx, 32, DIELParser.RULE_dropQuery);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 313;
			this.match(DIELParser.DROP);
			this.state = 314;
			this.match(DIELParser.TABLE);
			this.state = 315;
			this.match(DIELParser.IDENTIFIER);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public deleteStmt(): DeleteStmtContext {
		let _localctx: DeleteStmtContext = new DeleteStmtContext(this._ctx, this.state);
		this.enterRule(_localctx, 34, DIELParser.RULE_deleteStmt);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 317;
			this.match(DIELParser.DELETE);
			this.state = 318;
			this.match(DIELParser.FROM);
			this.state = 319;
			this.match(DIELParser.IDENTIFIER);
			this.state = 322;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la===DIELParser.WHERE) {
				{
				this.state = 320;
				this.match(DIELParser.WHERE);
				this.state = 321;
				this.expr(0);
				}
			}

			this.state = 324;
			this.match(DIELParser.DELIM);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public variableAssignment(): VariableAssignmentContext {
		let _localctx: VariableAssignmentContext = new VariableAssignmentContext(this._ctx, this.state);
		this.enterRule(_localctx, 36, DIELParser.RULE_variableAssignment);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 326;
			_localctx._variable = this.match(DIELParser.IDENTIFIER);
			this.state = 327;
			this.match(DIELParser.T__2);
			this.state = 328;
			_localctx._assignment = this.match(DIELParser.STRING);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public compositeSelect(): CompositeSelectContext {
		let _localctx: CompositeSelectContext = new CompositeSelectContext(this._ctx, this.state);
		this.enterRule(_localctx, 38, DIELParser.RULE_compositeSelect);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 330;
			this.setOp();
			this.state = 331;
			this.selectUnitQuery();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public setOp(): SetOpContext {
		let _localctx: SetOpContext = new SetOpContext(this._ctx, this.state);
		this.enterRule(_localctx, 40, DIELParser.RULE_setOp);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 333;
			_la = this._input.LA(1);
			if ( !(_la===DIELParser.INTERSECT || _la===DIELParser.UNION) ) {
			this._errHandler.recoverInline(this);
			} else {
				if (this._input.LA(1) === Token.EOF) {
					this.matchedEOF = true;
				}

				this._errHandler.reportMatch(this);
				this.consume();
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public selectUnitQuery(): SelectUnitQueryContext {
		let _localctx: SelectUnitQueryContext = new SelectUnitQueryContext(this._ctx, this.state);
		this.enterRule(_localctx, 42, DIELParser.RULE_selectUnitQuery);
		let _la: number;
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 335;
			this.match(DIELParser.SELECT);
			this.state = 337;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la===DIELParser.DISTINCT) {
				{
				this.state = 336;
				this.match(DIELParser.DISTINCT);
				}
			}

			this.state = 339;
			this.selectColumnClause();
			this.state = 344;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la===DIELParser.COMMA) {
				{
				{
				this.state = 340;
				this.match(DIELParser.COMMA);
				this.state = 341;
				this.selectColumnClause();
				}
				}
				this.state = 346;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 367;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la===DIELParser.FROM) {
				{
				this.state = 347;
				this.match(DIELParser.FROM);
				this.state = 348;
				this.relationReference();
				this.state = 352;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input,33,this._ctx);
				while ( _alt!==2 && _alt!==ATN.INVALID_ALT_NUMBER ) {
					if ( _alt===1 ) {
						{
						{
						this.state = 349;
						this.joinClause();
						}
						} 
					}
					this.state = 354;
					this._errHandler.sync(this);
					_alt = this.interpreter.adaptivePredict(this._input,33,this._ctx);
				}
				this.state = 356;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===DIELParser.WHERE) {
					{
					this.state = 355;
					this.whereClause();
					}
				}

				this.state = 359;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===DIELParser.GROUP) {
					{
					this.state = 358;
					this.groupByClause();
					}
				}

				this.state = 362;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===DIELParser.ORDER) {
					{
					this.state = 361;
					this.orderByClause();
					}
				}

				this.state = 365;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===DIELParser.LIMIT) {
					{
					this.state = 364;
					this.limitClause();
					}
				}

				}
			}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public whereClause(): WhereClauseContext {
		let _localctx: WhereClauseContext = new WhereClauseContext(this._ctx, this.state);
		this.enterRule(_localctx, 44, DIELParser.RULE_whereClause);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 369;
			this.match(DIELParser.WHERE);
			this.state = 370;
			this.expr(0);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public groupByClause(): GroupByClauseContext {
		let _localctx: GroupByClauseContext = new GroupByClauseContext(this._ctx, this.state);
		this.enterRule(_localctx, 46, DIELParser.RULE_groupByClause);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 372;
			this.match(DIELParser.GROUP);
			this.state = 373;
			this.match(DIELParser.BY);
			this.state = 374;
			this.expr(0);
			this.state = 379;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la===DIELParser.COMMA) {
				{
				{
				this.state = 375;
				this.match(DIELParser.COMMA);
				this.state = 376;
				this.expr(0);
				}
				}
				this.state = 381;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 383;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la===DIELParser.HAVING) {
				{
				this.state = 382;
				this.havingClause();
				}
			}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public havingClause(): HavingClauseContext {
		let _localctx: HavingClauseContext = new HavingClauseContext(this._ctx, this.state);
		this.enterRule(_localctx, 48, DIELParser.RULE_havingClause);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 385;
			this.match(DIELParser.HAVING);
			this.state = 386;
			this.expr(0);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public orderByClause(): OrderByClauseContext {
		let _localctx: OrderByClauseContext = new OrderByClauseContext(this._ctx, this.state);
		this.enterRule(_localctx, 50, DIELParser.RULE_orderByClause);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 388;
			this.match(DIELParser.ORDER);
			this.state = 389;
			this.match(DIELParser.BY);
			this.state = 390;
			this.orderSpec();
			this.state = 395;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la===DIELParser.COMMA) {
				{
				{
				this.state = 391;
				this.match(DIELParser.COMMA);
				this.state = 392;
				this.orderSpec();
				}
				}
				this.state = 397;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public orderSpec(): OrderSpecContext {
		let _localctx: OrderSpecContext = new OrderSpecContext(this._ctx, this.state);
		this.enterRule(_localctx, 52, DIELParser.RULE_orderSpec);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 398;
			this.expr(0);
			this.state = 400;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la===DIELParser.ASC || _la===DIELParser.DESC) {
				{
				this.state = 399;
				_la = this._input.LA(1);
				if ( !(_la===DIELParser.ASC || _la===DIELParser.DESC) ) {
				this._errHandler.recoverInline(this);
				} else {
					if (this._input.LA(1) === Token.EOF) {
						this.matchedEOF = true;
					}

					this._errHandler.reportMatch(this);
					this.consume();
				}
				}
			}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public insertQuery(): InsertQueryContext {
		let _localctx: InsertQueryContext = new InsertQueryContext(this._ctx, this.state);
		this.enterRule(_localctx, 54, DIELParser.RULE_insertQuery);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 402;
			this.match(DIELParser.INSERT);
			this.state = 403;
			this.match(DIELParser.INTO);
			this.state = 404;
			_localctx._relation = this.match(DIELParser.IDENTIFIER);
			this.state = 415;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la===DIELParser.T__0) {
				{
				this.state = 405;
				this.match(DIELParser.T__0);
				this.state = 406;
				_localctx._column = this.match(DIELParser.IDENTIFIER);
				this.state = 411;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while (_la===DIELParser.COMMA) {
					{
					{
					this.state = 407;
					this.match(DIELParser.COMMA);
					this.state = 408;
					_localctx._column = this.match(DIELParser.IDENTIFIER);
					}
					}
					this.state = 413;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				this.state = 414;
				this.match(DIELParser.T__1);
				}
			}

			this.state = 417;
			this.insertBody();
			this.state = 418;
			this.match(DIELParser.DELIM);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public insertBody(): InsertBodyContext {
		let _localctx: InsertBodyContext = new InsertBodyContext(this._ctx, this.state);
		this.enterRule(_localctx, 56, DIELParser.RULE_insertBody);
		let _la: number;
		try {
			this.state = 433;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case DIELParser.VALUES:
				_localctx = new InsertBodyDirectContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 420;
				this.match(DIELParser.VALUES);
				this.state = 421;
				this.match(DIELParser.T__0);
				this.state = 422;
				this.value();
				this.state = 427;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while (_la===DIELParser.COMMA) {
					{
					{
					this.state = 423;
					this.match(DIELParser.COMMA);
					this.state = 424;
					this.value();
					}
					}
					this.state = 429;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				this.state = 430;
				this.match(DIELParser.T__1);
				}
				break;
			case DIELParser.USE:
			case DIELParser.SELECT:
				_localctx = new InsertBodySelectContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 432;
				this.selectQuery();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public joinClause(): JoinClauseContext {
		let _localctx: JoinClauseContext = new JoinClauseContext(this._ctx, this.state);
		this.enterRule(_localctx, 58, DIELParser.RULE_joinClause);
		let _la: number;
		try {
			this.state = 450;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case DIELParser.NATURAL:
			case DIELParser.JOIN:
			case DIELParser.LEFT:
			case DIELParser.COMMA:
				_localctx = new JoinClauseBasicContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 442;
				this._errHandler.sync(this);
				switch (this._input.LA(1)) {
				case DIELParser.NATURAL:
				case DIELParser.JOIN:
				case DIELParser.LEFT:
					{
					{
					this.state = 438;
					this._errHandler.sync(this);
					switch (this._input.LA(1)) {
					case DIELParser.LEFT:
						{
						{
						this.state = 435;
						this.match(DIELParser.LEFT);
						this.state = 436;
						this.match(DIELParser.OUTER);
						}
						}
						break;
					case DIELParser.NATURAL:
						{
						this.state = 437;
						this.match(DIELParser.NATURAL);
						}
						break;
					case DIELParser.JOIN:
						break;
					default:
						break;
					}
					this.state = 440;
					this.match(DIELParser.JOIN);
					}
					}
					break;
				case DIELParser.COMMA:
					{
					this.state = 441;
					this.match(DIELParser.COMMA);
					}
					break;
				default:
					throw new NoViableAltException(this);
				}
				this.state = 444;
				this.relationReference();
				this.state = 447;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===DIELParser.ON) {
					{
					this.state = 445;
					this.match(DIELParser.ON);
					this.state = 446;
					this.expr(0);
					}
				}

				}
				break;
			case DIELParser.USE:
				_localctx = new JoinClauseTemplateContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 449;
				this.templateQuery();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public limitClause(): LimitClauseContext {
		let _localctx: LimitClauseContext = new LimitClauseContext(this._ctx, this.state);
		this.enterRule(_localctx, 60, DIELParser.RULE_limitClause);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 452;
			this.match(DIELParser.LIMIT);
			this.state = 453;
			this.expr(0);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public relationReference(): RelationReferenceContext {
		let _localctx: RelationReferenceContext = new RelationReferenceContext(this._ctx, this.state);
		this.enterRule(_localctx, 62, DIELParser.RULE_relationReference);
		let _la: number;
		try {
			this.state = 474;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case DIELParser.LATEST:
			case DIELParser.IDENTIFIER:
				_localctx = new RelationReferenceSimpleContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				{
				this.state = 456;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===DIELParser.LATEST) {
					{
					this.state = 455;
					this.match(DIELParser.LATEST);
					}
				}

				}
				this.state = 458;
				(_localctx as RelationReferenceSimpleContext)._relation = this.match(DIELParser.IDENTIFIER);
				this.state = 463;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===DIELParser.AS || _la===DIELParser.IDENTIFIER) {
					{
					this.state = 460;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
					if (_la===DIELParser.AS) {
						{
						this.state = 459;
						this.match(DIELParser.AS);
						}
					}

					this.state = 462;
					(_localctx as RelationReferenceSimpleContext)._alias = this.match(DIELParser.IDENTIFIER);
					}
				}

				}
				break;
			case DIELParser.T__0:
				_localctx = new RelationReferenceSubQueryContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 465;
				this.match(DIELParser.T__0);
				this.state = 466;
				this.selectQuery();
				this.state = 467;
				this.match(DIELParser.T__1);
				this.state = 472;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===DIELParser.AS || _la===DIELParser.IDENTIFIER) {
					{
					this.state = 469;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
					if (_la===DIELParser.AS) {
						{
						this.state = 468;
						this.match(DIELParser.AS);
						}
					}

					this.state = 471;
					(_localctx as RelationReferenceSubQueryContext)._alias = this.match(DIELParser.IDENTIFIER);
					}
				}

				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}

	public expr(): ExprContext;
	public expr(_p: number): ExprContext;
	@RuleVersion(0)
	public expr(_p?: number): ExprContext {
		if (_p === undefined) {
			_p = 0;
		}

		let _parentctx: ParserRuleContext = this._ctx;
		let _parentState: number = this.state;
		let _localctx: ExprContext = new ExprContext(this._ctx, _parentState);
		let _prevctx: ExprContext = _localctx;
		let _startState: number = 64;
		this.enterRecursionRule(_localctx, 64, DIELParser.RULE_expr, _p);
		let _la: number;
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 514;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input,60,this._ctx) ) {
			case 1:
				{
				_localctx = new ExprSimpleContext(_localctx);
				this._ctx = _localctx;
				_prevctx = _localctx;

				this.state = 477;
				this.unitExpr();
				}
				break;

			case 2:
				{
				_localctx = new ExprNegateContext(_localctx);
				this._ctx = _localctx;
				_prevctx = _localctx;
				this.state = 478;
				this.match(DIELParser.NOT);
				this.state = 479;
				this.expr(10);
				}
				break;

			case 3:
				{
				_localctx = new ExprParenthesisContext(_localctx);
				this._ctx = _localctx;
				_prevctx = _localctx;
				this.state = 480;
				this.match(DIELParser.T__0);
				this.state = 481;
				this.expr(0);
				this.state = 482;
				this.match(DIELParser.T__1);
				}
				break;

			case 4:
				{
				_localctx = new ExprFunctionContext(_localctx);
				this._ctx = _localctx;
				_prevctx = _localctx;
				this.state = 484;
				(_localctx as ExprFunctionContext)._function = this.match(DIELParser.IDENTIFIER);
				this.state = 485;
				this.match(DIELParser.T__0);
				this.state = 494;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===DIELParser.T__0 || _la===DIELParser.BOOLEANVAL || ((((_la - 65)) & ~0x1F) === 0 && ((1 << (_la - 65)) & ((1 << (DIELParser.EXIST - 65)) | (1 << (DIELParser.CASE - 65)) | (1 << (DIELParser.NOT - 65)))) !== 0) || ((((_la - 98)) & ~0x1F) === 0 && ((1 << (_la - 98)) & ((1 << (DIELParser.STAR - 98)) | (1 << (DIELParser.NUMBER - 98)) | (1 << (DIELParser.STRING - 98)) | (1 << (DIELParser.IDENTIFIER - 98)))) !== 0)) {
					{
					this.state = 486;
					this.expr(0);
					this.state = 491;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
					while (_la===DIELParser.COMMA) {
						{
						{
						this.state = 487;
						this.match(DIELParser.COMMA);
						this.state = 488;
						this.expr(0);
						}
						}
						this.state = 493;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
					}
					}
				}

				this.state = 496;
				this.match(DIELParser.T__1);
				}
				break;

			case 5:
				{
				_localctx = new ExprExistContext(_localctx);
				this._ctx = _localctx;
				_prevctx = _localctx;
				this.state = 498;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===DIELParser.NOT) {
					{
					this.state = 497;
					this.match(DIELParser.NOT);
					}
				}

				this.state = 500;
				this.match(DIELParser.EXIST);
				this.state = 501;
				this.match(DIELParser.T__0);
				this.state = 502;
				this.expr(0);
				this.state = 503;
				this.match(DIELParser.T__1);
				}
				break;

			case 6:
				{
				_localctx = new ExprWhenContext(_localctx);
				this._ctx = _localctx;
				_prevctx = _localctx;
				this.state = 505;
				this.match(DIELParser.CASE);
				this.state = 506;
				this.match(DIELParser.WHEN);
				this.state = 507;
				(_localctx as ExprWhenContext)._cond = this.expr(0);
				this.state = 508;
				this.match(DIELParser.THEN);
				this.state = 509;
				(_localctx as ExprWhenContext)._thenValue = this.expr(0);
				this.state = 510;
				this.match(DIELParser.ELSE);
				this.state = 511;
				(_localctx as ExprWhenContext)._elseValue = this.expr(0);
				this.state = 512;
				this.match(DIELParser.END);
				}
				break;
			}
			this._ctx._stop = this._input.tryLT(-1);
			this.state = 542;
			this._errHandler.sync(this);
			_alt = this.interpreter.adaptivePredict(this._input,64,this._ctx);
			while ( _alt!==2 && _alt!==ATN.INVALID_ALT_NUMBER ) {
				if ( _alt===1 ) {
					if ( this._parseListeners!=null ) this.triggerExitRuleEvent();
					_prevctx = _localctx;
					{
					this.state = 540;
					this._errHandler.sync(this);
					switch ( this.interpreter.adaptivePredict(this._input,63,this._ctx) ) {
					case 1:
						{
						_localctx = new ExprBinOpContext(new ExprContext(_parentctx, _parentState));
						(_localctx as ExprBinOpContext)._lhs = _prevctx;
						this.pushNewRecursionContext(_localctx, _startState, DIELParser.RULE_expr);
						this.state = 516;
						if (!(this.precpred(this._ctx, 6))) throw new FailedPredicateException(this, "this.precpred(this._ctx, 6)");
						this.state = 520;
						this._errHandler.sync(this);
						switch (this._input.LA(1)) {
						case DIELParser.T__4:
						case DIELParser.T__5:
						case DIELParser.T__6:
						case DIELParser.MINUS:
						case DIELParser.STAR:
							{
							this.state = 517;
							this.mathOp();
							}
							break;
						case DIELParser.T__2:
						case DIELParser.T__7:
						case DIELParser.T__8:
						case DIELParser.T__9:
						case DIELParser.T__10:
						case DIELParser.T__11:
							{
							this.state = 518;
							this.compareOp();
							}
							break;
						case DIELParser.AND:
						case DIELParser.OR:
							{
							this.state = 519;
							this.logicOp();
							}
							break;
						default:
							throw new NoViableAltException(this);
						}
						this.state = 522;
						(_localctx as ExprBinOpContext)._rhs = this.expr(7);
						}
						break;

					case 2:
						{
						_localctx = new ExprInContext(new ExprContext(_parentctx, _parentState));
						this.pushNewRecursionContext(_localctx, _startState, DIELParser.RULE_expr);
						this.state = 524;
						if (!(this.precpred(this._ctx, 1))) throw new FailedPredicateException(this, "this.precpred(this._ctx, 1)");
						this.state = 525;
						this.match(DIELParser.IN);
						this.state = 526;
						this.expr(2);
						}
						break;

					case 3:
						{
						_localctx = new ExprConcatContext(new ExprContext(_parentctx, _parentState));
						this.pushNewRecursionContext(_localctx, _startState, DIELParser.RULE_expr);
						this.state = 527;
						if (!(this.precpred(this._ctx, 9))) throw new FailedPredicateException(this, "this.precpred(this._ctx, 9)");
						this.state = 530; 
						this._errHandler.sync(this);
						_alt = 1;
						do {
							switch (_alt) {
							case 1:
								{
								{
								this.state = 528;
								this.match(DIELParser.PIPE);
								this.state = 529;
								this.expr(0);
								}
								}
								break;
							default:
								throw new NoViableAltException(this);
							}
							this.state = 532; 
							this._errHandler.sync(this);
							_alt = this.interpreter.adaptivePredict(this._input,62,this._ctx);
						} while ( _alt!==2 && _alt!==ATN.INVALID_ALT_NUMBER );
						}
						break;

					case 4:
						{
						_localctx = new ExprNullContext(new ExprContext(_parentctx, _parentState));
						this.pushNewRecursionContext(_localctx, _startState, DIELParser.RULE_expr);
						this.state = 534;
						if (!(this.precpred(this._ctx, 5))) throw new FailedPredicateException(this, "this.precpred(this._ctx, 5)");
						this.state = 535;
						this.match(DIELParser.IS);
						this.state = 536;
						this.match(DIELParser.NULL);
						}
						break;

					case 5:
						{
						_localctx = new ExprNotNullContext(new ExprContext(_parentctx, _parentState));
						this.pushNewRecursionContext(_localctx, _startState, DIELParser.RULE_expr);
						this.state = 537;
						if (!(this.precpred(this._ctx, 4))) throw new FailedPredicateException(this, "this.precpred(this._ctx, 4)");
						this.state = 538;
						this.match(DIELParser.NOT);
						this.state = 539;
						this.match(DIELParser.NULL);
						}
						break;
					}
					} 
				}
				this.state = 544;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input,64,this._ctx);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.unrollRecursionContexts(_parentctx);
		}
		return _localctx;
	}
	@RuleVersion(0)
	public unitExpr(): UnitExprContext {
		let _localctx: UnitExprContext = new UnitExprContext(this._ctx, this.state);
		this.enterRule(_localctx, 66, DIELParser.RULE_unitExpr);
		try {
			this.state = 558;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case DIELParser.STAR:
			case DIELParser.IDENTIFIER:
				_localctx = new UnitExprColumnContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 547;
				this._errHandler.sync(this);
				switch ( this.interpreter.adaptivePredict(this._input,65,this._ctx) ) {
				case 1:
					{
					this.state = 545;
					(_localctx as UnitExprColumnContext)._relation = this.match(DIELParser.IDENTIFIER);
					this.state = 546;
					this.match(DIELParser.T__3);
					}
					break;
				}
				this.state = 551;
				this._errHandler.sync(this);
				switch (this._input.LA(1)) {
				case DIELParser.IDENTIFIER:
					{
					this.state = 549;
					(_localctx as UnitExprColumnContext)._column = this.match(DIELParser.IDENTIFIER);
					}
					break;
				case DIELParser.STAR:
					{
					this.state = 550;
					this.match(DIELParser.STAR);
					}
					break;
				default:
					throw new NoViableAltException(this);
				}
				}
				break;
			case DIELParser.T__0:
				_localctx = new UnitExprSubQueryContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 553;
				this.match(DIELParser.T__0);
				this.state = 554;
				this.selectQuery();
				this.state = 555;
				this.match(DIELParser.T__1);
				}
				break;
			case DIELParser.BOOLEANVAL:
			case DIELParser.NUMBER:
			case DIELParser.STRING:
				_localctx = new UnitExprValueContext(_localctx);
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 557;
				this.value();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public selectColumnClause(): SelectColumnClauseContext {
		let _localctx: SelectColumnClauseContext = new SelectColumnClauseContext(this._ctx, this.state);
		this.enterRule(_localctx, 68, DIELParser.RULE_selectColumnClause);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 560;
			this.expr(0);
			this.state = 563;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la===DIELParser.AS) {
				{
				this.state = 561;
				this.match(DIELParser.AS);
				this.state = 562;
				this.match(DIELParser.IDENTIFIER);
				}
			}

			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public value(): ValueContext {
		let _localctx: ValueContext = new ValueContext(this._ctx, this.state);
		this.enterRule(_localctx, 70, DIELParser.RULE_value);
		try {
			this.state = 568;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case DIELParser.NUMBER:
				_localctx = new ValueNumberContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 565;
				this.match(DIELParser.NUMBER);
				}
				break;
			case DIELParser.STRING:
				_localctx = new ValueStringContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 566;
				this.match(DIELParser.STRING);
				}
				break;
			case DIELParser.BOOLEANVAL:
				_localctx = new ValueBooleanContext(_localctx);
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 567;
				this.match(DIELParser.BOOLEANVAL);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public mathOp(): MathOpContext {
		let _localctx: MathOpContext = new MathOpContext(this._ctx, this.state);
		this.enterRule(_localctx, 72, DIELParser.RULE_mathOp);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 570;
			_la = this._input.LA(1);
			if ( !((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << DIELParser.T__4) | (1 << DIELParser.T__5) | (1 << DIELParser.T__6))) !== 0) || _la===DIELParser.MINUS || _la===DIELParser.STAR) ) {
			this._errHandler.recoverInline(this);
			} else {
				if (this._input.LA(1) === Token.EOF) {
					this.matchedEOF = true;
				}

				this._errHandler.reportMatch(this);
				this.consume();
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public compareOp(): CompareOpContext {
		let _localctx: CompareOpContext = new CompareOpContext(this._ctx, this.state);
		this.enterRule(_localctx, 74, DIELParser.RULE_compareOp);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 572;
			_la = this._input.LA(1);
			if ( !((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << DIELParser.T__2) | (1 << DIELParser.T__7) | (1 << DIELParser.T__8) | (1 << DIELParser.T__9) | (1 << DIELParser.T__10) | (1 << DIELParser.T__11))) !== 0)) ) {
			this._errHandler.recoverInline(this);
			} else {
				if (this._input.LA(1) === Token.EOF) {
					this.matchedEOF = true;
				}

				this._errHandler.reportMatch(this);
				this.consume();
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	@RuleVersion(0)
	public logicOp(): LogicOpContext {
		let _localctx: LogicOpContext = new LogicOpContext(this._ctx, this.state);
		this.enterRule(_localctx, 76, DIELParser.RULE_logicOp);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 574;
			_la = this._input.LA(1);
			if ( !(_la===DIELParser.AND || _la===DIELParser.OR) ) {
			this._errHandler.recoverInline(this);
			} else {
				if (this._input.LA(1) === Token.EOF) {
					this.matchedEOF = true;
				}

				this._errHandler.reportMatch(this);
				this.consume();
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}

	public sempred(_localctx: RuleContext, ruleIndex: number, predIndex: number): boolean {
		switch (ruleIndex) {
		case 32:
			return this.expr_sempred(_localctx as ExprContext, predIndex);
		}
		return true;
	}
	private expr_sempred(_localctx: ExprContext, predIndex: number): boolean {
		switch (predIndex) {
		case 0:
			return this.precpred(this._ctx, 6);

		case 1:
			return this.precpred(this._ctx, 1);

		case 2:
			return this.precpred(this._ctx, 9);

		case 3:
			return this.precpred(this._ctx, 5);

		case 4:
			return this.precpred(this._ctx, 4);
		}
		return true;
	}

	private static readonly _serializedATNSegments: number = 2;
	private static readonly _serializedATNSegment0: string =
		"\x03\uAF6F\u8320\u479D\uB75C\u4880\u1605\u191C\uAB37\x03k\u0243\x04\x02"+
		"\t\x02\x04\x03\t\x03\x04\x04\t\x04\x04\x05\t\x05\x04\x06\t\x06\x04\x07"+
		"\t\x07\x04\b\t\b\x04\t\t\t\x04\n\t\n\x04\v\t\v\x04\f\t\f\x04\r\t\r\x04"+
		"\x0E\t\x0E\x04\x0F\t\x0F\x04\x10\t\x10\x04\x11\t\x11\x04\x12\t\x12\x04"+
		"\x13\t\x13\x04\x14\t\x14\x04\x15\t\x15\x04\x16\t\x16\x04\x17\t\x17\x04"+
		"\x18\t\x18\x04\x19\t\x19\x04\x1A\t\x1A\x04\x1B\t\x1B\x04\x1C\t\x1C\x04"+
		"\x1D\t\x1D\x04\x1E\t\x1E\x04\x1F\t\x1F\x04 \t \x04!\t!\x04\"\t\"\x04#"+
		"\t#\x04$\t$\x04%\t%\x04&\t&\x04\'\t\'\x04(\t(\x03\x02\x03\x02\x03\x02"+
		"\x03\x02\x03\x02\x03\x02\x03\x02\x03\x02\x06\x02Y\n\x02\r\x02\x0E\x02"+
		"Z\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03\x04\x03"+
		"\x04\x03\x04\x03\x04\x03\x04\x03\x04\x03\x04\x07\x04k\n\x04\f\x04\x0E"+
		"\x04n\v\x04\x03\x04\x03\x04\x03\x04\x05\x04s\n\x04\x03\x04\x03\x04\x03"+
		"\x05\x03\x05\x03\x06\x03\x06\x03\x06\x07\x06|\n\x06\f\x06\x0E\x06\x7F"+
		"\v\x06\x03\x06\x03\x06\x03\x06\x03\x06\x03\x06\x03\x06\x03\x06\x07\x06"+
		"\x88\n\x06\f\x06\x0E\x06\x8B\v\x06\x05\x06\x8D\n\x06\x03\x06\x05\x06\x90"+
		"\n\x06\x05\x06\x92\n\x06\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07"+
		"\x07\x07\x9A\n\x07\f\x07\x0E\x07\x9D\v\x07\x03\x07\x03\x07\x03\x07\x03"+
		"\x07\x03\x07\x03\x07\x07\x07\xA5\n\x07\f\x07\x0E\x07\xA8\v\x07\x03\x07"+
		"\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07"+
		"\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x05\x07"+
		"\xBC\n\x07\x03\b\x03\b\x03\b\x03\b\x05\b\xC2\n\b\x03\b\x05\b\xC5\n\b\x03"+
		"\b\x03\b\x03\b\x03\b\x03\t\x03\t\x03\t\x03\t\x07\t\xCF\n\t\f\t\x0E\t\xD2"+
		"\v\t\x03\t\x03\t\x07\t\xD6\n\t\f\t\x0E\t\xD9\v\t\x05\t\xDB\n\t\x03\t\x03"+
		"\t\x03\t\x05\t\xE0\n\t\x03\n\x03\n\x03\n\x03\n\x07\n\xE6\n\n\f\n\x0E\n"+
		"\xE9\v\n\x03\v\x03\v\x03\v\x03\v\x03\v\x03\v\x05\v\xF1\n\v\x03\f\x03\f"+
		"\x05\f\xF5\n\f\x03\f\x03\f\x03\f\x05\f\xFA\n\f\x03\f\x05\f\xFD\n\f\x03"+
		"\f\x03\f\x03\f\x03\f\x05\f\u0103\n\f\x03\f\x03\f\x03\r\x03\r\x03\r\x03"+
		"\r\x03\r\x03\r\x03\r\x07\r\u010E\n\r\f\r\x0E\r\u0111\v\r\x03\r\x03\r\x03"+
		"\r\x03\r\x03\x0E\x03\x0E\x06\x0E\u0119\n\x0E\r\x0E\x0E\x0E\u011A\x03\x0E"+
		"\x03\x0E\x03\x0F\x03\x0F\x03\x0F\x05\x0F\u0122\n\x0F\x03\x10\x03\x10\x07"+
		"\x10\u0126\n\x10\f\x10\x0E\x10\u0129\v\x10\x03\x10\x05\x10\u012C\n\x10"+
		"\x03\x11\x03\x11\x03\x11\x03\x11\x03\x11\x03\x11\x03\x11\x07\x11\u0135"+
		"\n\x11\f\x11\x0E\x11\u0138\v\x11\x03\x11\x03\x11\x03\x12\x03\x12\x03\x12"+
		"\x03\x12\x03\x13\x03\x13\x03\x13\x03\x13\x03\x13\x05\x13\u0145\n\x13\x03"+
		"\x13\x03\x13\x03\x14\x03\x14\x03\x14\x03\x14\x03\x15\x03\x15\x03\x15\x03"+
		"\x16\x03\x16\x03\x17\x03\x17\x05\x17\u0154\n\x17\x03\x17\x03\x17\x03\x17"+
		"\x07\x17\u0159\n\x17\f\x17\x0E\x17\u015C\v\x17\x03\x17\x03\x17\x03\x17"+
		"\x07\x17\u0161\n\x17\f\x17\x0E\x17\u0164\v\x17\x03\x17\x05\x17\u0167\n"+
		"\x17\x03\x17\x05\x17\u016A\n\x17\x03\x17\x05\x17\u016D\n\x17\x03\x17\x05"+
		"\x17\u0170\n\x17\x05\x17\u0172\n\x17\x03\x18\x03\x18\x03\x18\x03\x19\x03"+
		"\x19\x03\x19\x03\x19\x03\x19\x07\x19\u017C\n\x19\f\x19\x0E\x19\u017F\v"+
		"\x19\x03\x19\x05\x19\u0182\n\x19\x03\x1A\x03\x1A\x03\x1A\x03\x1B\x03\x1B"+
		"\x03\x1B\x03\x1B\x03\x1B\x07\x1B\u018C\n\x1B\f\x1B\x0E\x1B\u018F\v\x1B"+
		"\x03\x1C\x03\x1C\x05\x1C\u0193\n\x1C\x03\x1D\x03\x1D\x03\x1D\x03\x1D\x03"+
		"\x1D\x03\x1D\x03\x1D\x07\x1D\u019C\n\x1D\f\x1D\x0E\x1D\u019F\v\x1D\x03"+
		"\x1D\x05\x1D\u01A2\n\x1D\x03\x1D\x03\x1D\x03\x1D\x03\x1E\x03\x1E\x03\x1E"+
		"\x03\x1E\x03\x1E\x07\x1E\u01AC\n\x1E\f\x1E\x0E\x1E\u01AF\v\x1E\x03\x1E"+
		"\x03\x1E\x03\x1E\x05\x1E\u01B4\n\x1E\x03\x1F\x03\x1F\x03\x1F\x05\x1F\u01B9"+
		"\n\x1F\x03\x1F\x03\x1F\x05\x1F\u01BD\n\x1F\x03\x1F\x03\x1F\x03\x1F\x05"+
		"\x1F\u01C2\n\x1F\x03\x1F\x05\x1F\u01C5\n\x1F\x03 \x03 \x03 \x03!\x05!"+
		"\u01CB\n!\x03!\x03!\x05!\u01CF\n!\x03!\x05!\u01D2\n!\x03!\x03!\x03!\x03"+
		"!\x05!\u01D8\n!\x03!\x05!\u01DB\n!\x05!\u01DD\n!\x03\"\x03\"\x03\"\x03"+
		"\"\x03\"\x03\"\x03\"\x03\"\x03\"\x03\"\x03\"\x03\"\x03\"\x07\"\u01EC\n"+
		"\"\f\"\x0E\"\u01EF\v\"\x05\"\u01F1\n\"\x03\"\x03\"\x05\"\u01F5\n\"\x03"+
		"\"\x03\"\x03\"\x03\"\x03\"\x03\"\x03\"\x03\"\x03\"\x03\"\x03\"\x03\"\x03"+
		"\"\x03\"\x05\"\u0205\n\"\x03\"\x03\"\x03\"\x03\"\x05\"\u020B\n\"\x03\""+
		"\x03\"\x03\"\x03\"\x03\"\x03\"\x03\"\x03\"\x06\"\u0215\n\"\r\"\x0E\"\u0216"+
		"\x03\"\x03\"\x03\"\x03\"\x03\"\x03\"\x07\"\u021F\n\"\f\"\x0E\"\u0222\v"+
		"\"\x03#\x03#\x05#\u0226\n#\x03#\x03#\x05#\u022A\n#\x03#\x03#\x03#\x03"+
		"#\x03#\x05#\u0231\n#\x03$\x03$\x03$\x05$\u0236\n$\x03%\x03%\x03%\x05%"+
		"\u023B\n%\x03&\x03&\x03\'\x03\'\x03(\x03(\x03(\x02\x02\x03B)\x02\x02\x04"+
		"\x02\x06\x02\b\x02\n\x02\f\x02\x0E\x02\x10\x02\x12\x02\x14\x02\x16\x02"+
		"\x18\x02\x1A\x02\x1C\x02\x1E\x02 \x02\"\x02$\x02&\x02(\x02*\x02,\x02."+
		"\x020\x022\x024\x026\x028\x02:\x02<\x02>\x02@\x02B\x02D\x02F\x02H\x02"+
		"J\x02L\x02N\x02\x02\b\x05\x0211YY_`\x03\x02JK\x03\x02VW\x05\x02\x07\t"+
		"bbdd\x04\x02\x05\x05\n\x0E\x03\x02GH\u027A\x02X\x03\x02\x02\x02\x04\\"+
		"\x03\x02\x02\x02\x06c\x03\x02\x02\x02\bv\x03\x02\x02\x02\nx\x03\x02\x02"+
		"\x02\f\xBB\x03\x02\x02\x02\x0E\xC4\x03\x02\x02\x02\x10\xDF\x03\x02\x02"+
		"\x02\x12\xE1\x03\x02\x02\x02\x14\xF0\x03\x02\x02\x02\x16\xF2\x03\x02\x02"+
		"\x02\x18\u0106\x03\x02\x02\x02\x1A\u0116\x03\x02\x02\x02\x1C\u0121\x03"+
		"\x02\x02\x02\x1E\u012B\x03\x02\x02\x02 \u012D\x03\x02\x02\x02\"\u013B"+
		"\x03\x02\x02\x02$\u013F\x03\x02\x02\x02&\u0148\x03\x02\x02\x02(\u014C"+
		"\x03\x02\x02\x02*\u014F\x03\x02\x02\x02,\u0151\x03\x02\x02\x02.\u0173"+
		"\x03\x02\x02\x020\u0176\x03\x02\x02\x022\u0183\x03\x02\x02\x024\u0186"+
		"\x03\x02\x02\x026\u0190\x03\x02\x02\x028\u0194\x03\x02\x02\x02:\u01B3"+
		"\x03\x02\x02\x02<\u01C4\x03\x02\x02\x02>\u01C6\x03\x02\x02\x02@\u01DC"+
		"\x03\x02\x02\x02B\u0204\x03\x02\x02\x02D\u0230\x03\x02\x02\x02F\u0232"+
		"\x03\x02\x02\x02H\u023A\x03\x02\x02\x02J\u023C\x03\x02\x02\x02L\u023E"+
		"\x03\x02\x02\x02N\u0240\x03\x02\x02\x02PY\x05\x16\f\x02QY\x05\x18\r\x02"+
		"RY\x05\x06\x04\x02SY\x058\x1D\x02TY\x05\x0E\b\x02UY\x05\x04\x03\x02VY"+
		"\x05\"\x12\x02WY\x05$\x13\x02XP\x03\x02\x02\x02XQ\x03\x02\x02\x02XR\x03"+
		"\x02\x02\x02XS\x03\x02\x02\x02XT\x03\x02\x02\x02XU\x03\x02\x02\x02XV\x03"+
		"\x02\x02\x02XW\x03\x02\x02\x02YZ\x03\x02\x02\x02ZX\x03\x02\x02\x02Z[\x03"+
		"\x02\x02\x02[\x03\x03\x02\x02\x02\\]\x07!\x02\x02]^\x07#\x02\x02^_\x07"+
		"j\x02\x02_`\x07\"\x02\x02`a\x05\b\x05\x02ab\x07c\x02\x02b\x05\x03\x02"+
		"\x02\x02cd\x07$\x02\x02de\x07\x15\x02\x02ef\x07j\x02\x02fg\x07\x03\x02"+
		"\x02gl\x07j\x02\x02hi\x07e\x02\x02ik\x07j\x02\x02jh\x03\x02\x02\x02kn"+
		"\x03\x02\x02\x02lj\x03\x02\x02\x02lm\x03\x02\x02\x02mo\x03\x02\x02\x02"+
		"nl\x03\x02\x02\x02or\x07\x04\x02\x02ps\x05\x1E\x10\x02qs\x05<\x1F\x02"+
		"rp\x03\x02\x02\x02rq\x03\x02\x02\x02st\x03\x02\x02\x02tu\x07c\x02\x02"+
		"u\x07\x03\x02\x02\x02vw\t\x02\x02\x02w\t\x03\x02\x02\x02xy\x07j\x02\x02"+
		"y}\x05\b\x05\x02z|\x05\x14\v\x02{z\x03\x02\x02\x02|\x7F\x03\x02\x02\x02"+
		"}{\x03\x02\x02\x02}~\x03\x02\x02\x02~\x91\x03\x02\x02\x02\x7F}\x03\x02"+
		"\x02\x02\x80\x8F\x07%\x02\x02\x81\x90\x05H%\x02\x82\x83\x07j\x02\x02\x83"+
		"\x8C\x07\x03\x02\x02\x84\x89\x05H%\x02\x85\x86\x07e\x02\x02\x86\x88\x05"+
		"H%\x02\x87\x85\x03\x02\x02\x02\x88\x8B\x03\x02\x02\x02\x89\x87\x03\x02"+
		"\x02\x02\x89\x8A\x03\x02\x02\x02\x8A\x8D\x03\x02\x02\x02\x8B\x89\x03\x02"+
		"\x02\x02\x8C\x84\x03\x02\x02\x02\x8C\x8D\x03\x02\x02\x02\x8D\x8E\x03\x02"+
		"\x02\x02\x8E\x90\x07\x04\x02\x02\x8F\x81\x03\x02\x02\x02\x8F\x82\x03\x02"+
		"\x02\x02\x90\x92\x03\x02\x02\x02\x91\x80\x03\x02\x02\x02\x91\x92\x03\x02"+
		"\x02\x02\x92\v\x03\x02\x02\x02\x93\x94\x07+\x02\x02\x94\x95\x07.\x02\x02"+
		"\x95\x96\x07\x03\x02\x02\x96\x9B\x07j\x02\x02\x97\x98\x07e\x02\x02\x98"+
		"\x9A\x07j\x02\x02\x99\x97\x03\x02\x02\x02\x9A\x9D\x03\x02\x02\x02\x9B"+
		"\x99\x03\x02\x02\x02\x9B\x9C\x03\x02\x02\x02\x9C\x9E\x03\x02\x02\x02\x9D"+
		"\x9B\x03\x02\x02\x02\x9E\xBC\x07\x04\x02\x02\x9F\xA0\x07*\x02\x02\xA0"+
		"\xA1\x07\x03\x02\x02\xA1\xA6\x07j\x02\x02\xA2\xA3\x07e\x02\x02\xA3\xA5"+
		"\x07j\x02\x02\xA4\xA2\x03\x02\x02\x02\xA5\xA8\x03\x02\x02\x02\xA6\xA4"+
		"\x03\x02\x02\x02\xA6\xA7\x03\x02\x02\x02\xA7\xA9\x03\x02\x02\x02\xA8\xA6"+
		"\x03\x02\x02\x02\xA9\xBC\x07\x04\x02\x02\xAA\xAB\x07j\x02\x02\xAB\xAC"+
		"\x07T\x02\x02\xAC\xBC\x07S\x02\x02\xAD\xAE\x07,\x02\x02\xAE\xAF\x07.\x02"+
		"\x02\xAF\xB0\x07\x03\x02\x02\xB0\xB1\x07j\x02\x02\xB1\xB2\x07\x04\x02"+
		"\x02\xB2\xB3\x07-\x02\x02\xB3\xB4\x07j\x02\x02\xB4\xB5\x07\x03\x02\x02"+
		"\xB5\xB6\x07j\x02\x02\xB6\xBC\x07\x04\x02\x02\xB7\xB8\x07\x1E\x02\x02"+
		"\xB8\xBC\x07\x1F\x02\x02\xB9\xBA\x07)\x02\x02\xBA\xBC\x05B\"\x02\xBB\x93"+
		"\x03\x02\x02\x02\xBB\x9F\x03\x02\x02\x02\xBB\xAA\x03\x02\x02\x02\xBB\xAD"+
		"\x03\x02\x02\x02\xBB\xB7\x03\x02\x02\x02\xBB\xB9\x03\x02\x02\x02\xBC\r"+
		"\x03\x02\x02\x02\xBD\xBE\x07!\x02\x02\xBE\xC5\x07/\x02\x02\xBF\xC1\x07"+
		"$\x02\x02\xC0\xC2\x07\x10\x02\x02\xC1\xC0\x03\x02\x02\x02\xC1\xC2\x03"+
		"\x02\x02\x02\xC2\xC3\x03\x02\x02\x02\xC3\xC5\x07/\x02\x02\xC4\xBD\x03"+
		"\x02\x02\x02\xC4\xBF\x03\x02\x02\x02\xC5\xC6\x03\x02\x02\x02\xC6\xC7\x07"+
		"j\x02\x02\xC7\xC8\x05\x10\t\x02\xC8\xC9\x07c\x02\x02\xC9\x0F\x03\x02\x02"+
		"\x02\xCA\xDA\x07\x03\x02\x02\xCB\xD0\x05\n\x06\x02\xCC\xCD\x07e\x02\x02"+
		"\xCD\xCF\x05\n\x06\x02\xCE\xCC\x03\x02\x02\x02\xCF\xD2\x03\x02\x02\x02"+
		"\xD0\xCE\x03\x02\x02\x02\xD0\xD1\x03\x02\x02\x02\xD1\xD7\x03\x02\x02\x02"+
		"\xD2\xD0\x03\x02\x02\x02\xD3\xD4\x07e\x02\x02\xD4\xD6\x05\f\x07\x02\xD5"+
		"\xD3\x03\x02\x02\x02\xD6\xD9\x03\x02\x02\x02\xD7\xD5\x03\x02\x02\x02\xD7"+
		"\xD8\x03\x02\x02\x02\xD8\xDB\x03\x02\x02\x02\xD9\xD7\x03\x02\x02\x02\xDA"+
		"\xCB\x03\x02\x02\x02\xDA\xDB\x03\x02\x02\x02\xDB\xDC\x03\x02\x02\x02\xDC"+
		"\xE0\x07\x04\x02\x02\xDD\xDE\x07;\x02\x02\xDE\xE0\x07j\x02\x02\xDF\xCA"+
		"\x03\x02\x02\x02\xDF\xDD\x03\x02\x02\x02\xE0\x11\x03\x02\x02\x02\xE1\xE2"+
		"\x07\x14\x02\x02\xE2\xE7\x05\f\x07\x02\xE3\xE4\x07e\x02\x02\xE4\xE6\x05"+
		"\f\x07\x02\xE5\xE3\x03\x02\x02\x02\xE6\xE9\x03\x02\x02\x02\xE7\xE5\x03"+
		"\x02\x02\x02\xE7\xE8\x03\x02\x02\x02\xE8\x13\x03\x02\x02\x02\xE9\xE7\x03"+
		"\x02\x02\x02\xEA\xF1\x07*\x02\x02\xEB\xEC\x07+\x02\x02\xEC\xF1\x07.\x02"+
		"\x02\xED\xEE\x07T\x02\x02\xEE\xF1\x07S\x02\x02\xEF\xF1\x07X\x02\x02\xF0"+
		"\xEA\x03\x02\x02\x02\xF0\xEB\x03\x02\x02\x02\xF0\xED\x03\x02\x02\x02\xF0"+
		"\xEF\x03\x02\x02\x02\xF1\x15\x03\x02\x02\x02\xF2\xFC\x07$\x02\x02\xF3"+
		"\xF5\x07\x10\x02\x02\xF4\xF3\x03\x02\x02\x02\xF4\xF5\x03\x02\x02\x02\xF5"+
		"\xF6\x03\x02\x02\x02\xF6\xFD\x070\x02\x02\xF7\xF9\x072\x02\x02\xF8\xFA"+
		"\x07]\x02\x02\xF9\xF8\x03\x02\x02\x02\xF9\xFA\x03\x02\x02\x02\xFA\xFD"+
		"\x03\x02\x02\x02\xFB\xFD\x07/\x02\x02\xFC\xF4\x03\x02\x02\x02\xFC\xF7"+
		"\x03\x02\x02\x02\xFC\xFB\x03\x02\x02\x02\xFD\xFE\x03\x02\x02\x02\xFE\xFF"+
		"\x07j\x02\x02\xFF\u0100\x07;\x02\x02\u0100\u0102\x05\x1E\x10\x02\u0101"+
		"\u0103\x05\x12\n\x02\u0102\u0101\x03\x02\x02\x02\u0102\u0103\x03\x02\x02"+
		"\x02\u0103\u0104\x03\x02\x02\x02\u0104\u0105\x07c\x02\x02\u0105\x17\x03"+
		"\x02\x02\x02\u0106\u0107\x07$\x02\x02\u0107\u0108\x073\x02\x02\u0108\u0109"+
		"\x074\x02\x02\u0109\u010A\x07\x03\x02\x02\u010A\u010F\x07j\x02\x02\u010B"+
		"\u010C\x07e\x02\x02\u010C\u010E\x07j\x02\x02\u010D\u010B\x03\x02\x02\x02"+
		"\u010E\u0111\x03\x02\x02\x02\u010F\u010D\x03\x02\x02\x02\u010F\u0110\x03"+
		"\x02\x02\x02\u0110\u0112\x03\x02\x02\x02\u0111\u010F\x03\x02\x02\x02\u0112"+
		"\u0113\x07\x04\x02\x02\u0113\u0114\x05\x1A\x0E\x02\u0114\u0115\x07c\x02"+
		"\x02\u0115\x19\x03\x02\x02\x02\u0116\u0118\x075\x02\x02\u0117\u0119\x05"+
		"\x1C\x0F\x02\u0118\u0117\x03\x02\x02\x02\u0119\u011A\x03\x02\x02\x02\u011A"+
		"\u0118\x03\x02\x02\x02\u011A\u011B\x03\x02\x02\x02\u011B\u011C\x03\x02"+
		"\x02\x02\u011C\u011D\x076\x02\x02\u011D\x1B\x03\x02\x02\x02\u011E\u0122"+
		"\x058\x1D\x02\u011F\u0122\x05\x1E\x10\x02\u0120\u0122\x05$\x13\x02\u0121"+
		"\u011E\x03\x02\x02\x02\u0121\u011F\x03\x02\x02\x02\u0121\u0120\x03\x02"+
		"\x02\x02\u0122\x1D\x03\x02\x02\x02\u0123\u0127\x05,\x17\x02\u0124\u0126"+
		"\x05(\x15\x02\u0125\u0124\x03\x02\x02\x02\u0126\u0129\x03\x02\x02\x02"+
		"\u0127\u0125\x03\x02\x02\x02\u0127\u0128\x03\x02\x02\x02\u0128\u012C\x03"+
		"\x02\x02\x02\u0129\u0127\x03\x02\x02\x02\u012A\u012C\x05 \x11\x02\u012B"+
		"\u0123\x03\x02\x02\x02\u012B\u012A\x03\x02\x02\x02\u012C\x1F\x03\x02\x02"+
		"\x02\u012D\u012E\x07\x1A\x02\x02\u012E\u012F\x07\x15\x02\x02\u012F\u0130"+
		"\x07j\x02\x02\u0130\u0131\x07\x03\x02\x02\u0131\u0136\x05&\x14\x02\u0132"+
		"\u0133\x07e\x02\x02\u0133\u0135\x05&\x14\x02\u0134\u0132\x03\x02\x02\x02"+
		"\u0135\u0138\x03\x02\x02\x02\u0136\u0134\x03\x02\x02\x02\u0136\u0137\x03"+
		"\x02\x02\x02\u0137\u0139\x03\x02\x02\x02\u0138\u0136\x03\x02\x02\x02\u0139"+
		"\u013A\x07\x04\x02\x02\u013A!\x03\x02\x02\x02\u013B\u013C\x07(\x02\x02"+
		"\u013C\u013D\x07/\x02\x02\u013D\u013E\x07j\x02\x02\u013E#\x03\x02\x02"+
		"\x02\u013F\u0140\x07^\x02\x02\u0140\u0141\x07=\x02\x02\u0141\u0144\x07"+
		"j\x02\x02\u0142\u0143\x07A\x02\x02\u0143\u0145\x05B\"\x02\u0144\u0142"+
		"\x03\x02\x02\x02\u0144\u0145\x03\x02\x02\x02\u0145\u0146\x03\x02\x02\x02"+
		"\u0146\u0147\x07c\x02\x02\u0147%\x03\x02\x02\x02\u0148\u0149\x07j\x02"+
		"\x02\u0149\u014A\x07\x05\x02\x02\u014A\u014B\x07i\x02\x02\u014B\'\x03"+
		"\x02\x02\x02\u014C\u014D\x05*\x16\x02\u014D\u014E\x05,\x17\x02\u014E)"+
		"\x03\x02\x02\x02\u014F\u0150\t\x03\x02\x02\u0150+\x03\x02\x02\x02\u0151"+
		"\u0153\x07<\x02\x02\u0152\u0154\x07Z\x02\x02\u0153\u0152\x03\x02\x02\x02"+
		"\u0153\u0154\x03\x02\x02\x02\u0154\u0155\x03\x02\x02\x02\u0155\u015A\x05"+
		"F$\x02\u0156\u0157\x07e\x02\x02\u0157\u0159\x05F$\x02\u0158\u0156\x03"+
		"\x02\x02\x02\u0159\u015C\x03\x02\x02\x02\u015A\u0158\x03\x02\x02\x02\u015A"+
		"\u015B\x03\x02\x02\x02\u015B\u0171\x03\x02\x02\x02\u015C\u015A\x03\x02"+
		"\x02\x02\u015D\u015E\x07=\x02\x02\u015E\u0162\x05@!\x02\u015F\u0161\x05"+
		"<\x1F\x02\u0160\u015F\x03\x02\x02\x02\u0161\u0164\x03\x02\x02\x02\u0162"+
		"\u0160\x03\x02\x02\x02\u0162\u0163\x03\x02\x02\x02\u0163\u0166\x03\x02"+
		"\x02\x02\u0164\u0162\x03\x02\x02\x02\u0165\u0167\x05.\x18\x02\u0166\u0165"+
		"\x03\x02\x02\x02\u0166\u0167\x03\x02\x02\x02\u0167\u0169\x03\x02\x02\x02"+
		"\u0168\u016A\x050\x19\x02\u0169\u0168\x03\x02\x02\x02\u0169\u016A\x03"+
		"\x02\x02\x02\u016A\u016C\x03\x02\x02\x02\u016B\u016D\x054\x1B\x02\u016C"+
		"\u016B\x03\x02\x02\x02\u016C\u016D\x03\x02\x02\x02\u016D\u016F\x03\x02"+
		"\x02\x02\u016E\u0170\x05> \x02\u016F\u016E\x03\x02\x02\x02\u016F\u0170"+
		"\x03\x02\x02\x02\u0170\u0172\x03\x02\x02\x02\u0171\u015D\x03\x02\x02\x02"+
		"\u0171\u0172\x03\x02\x02\x02\u0172-\x03\x02\x02\x02\u0173\u0174\x07A\x02"+
		"\x02\u0174\u0175\x05B\"\x02\u0175/\x03\x02\x02\x02\u0176\u0177\x07D\x02"+
		"\x02\u0177\u0178\x07E\x02\x02\u0178\u017D\x05B\"\x02\u0179\u017A\x07e"+
		"\x02\x02\u017A\u017C\x05B\"\x02\u017B\u0179\x03\x02\x02\x02\u017C\u017F"+
		"\x03\x02\x02\x02\u017D\u017B\x03\x02\x02\x02\u017D\u017E\x03\x02\x02\x02"+
		"\u017E\u0181\x03\x02\x02\x02\u017F\u017D\x03\x02\x02\x02\u0180\u0182\x05"+
		"2\x1A\x02\u0181\u0180\x03\x02\x02\x02\u0181\u0182\x03\x02\x02\x02\u0182"+
		"1\x03\x02\x02\x02\u0183\u0184\x07F\x02\x02\u0184\u0185\x05B\"\x02\u0185"+
		"3\x03\x02\x02\x02\u0186\u0187\x07U\x02\x02\u0187\u0188\x07E\x02\x02\u0188"+
		"\u018D\x056\x1C\x02\u0189\u018A\x07e\x02\x02\u018A\u018C\x056\x1C\x02"+
		"\u018B\u0189\x03\x02\x02\x02\u018C\u018F\x03\x02\x02\x02\u018D\u018B\x03"+
		"\x02\x02\x02\u018D\u018E\x03\x02\x02\x02\u018E5\x03\x02\x02\x02\u018F"+
		"\u018D\x03\x02\x02\x02\u0190\u0192\x05B\"\x02\u0191\u0193\t\x04\x02\x02"+
		"\u0192\u0191\x03\x02\x02\x02\u0192\u0193\x03\x02\x02\x02\u01937\x03\x02"+
		"\x02\x02\u0194\u0195\x078\x02\x02\u0195\u0196\x079\x02\x02\u0196\u01A1"+
		"\x07j\x02\x02\u0197\u0198\x07\x03\x02\x02\u0198\u019D\x07j\x02\x02\u0199"+
		"\u019A\x07e\x02\x02\u019A\u019C\x07j\x02\x02\u019B\u0199\x03\x02\x02\x02"+
		"\u019C\u019F\x03\x02\x02\x02\u019D\u019B\x03\x02\x02\x02\u019D\u019E\x03"+
		"\x02\x02\x02\u019E\u01A0\x03\x02\x02\x02\u019F\u019D\x03\x02\x02\x02\u01A0"+
		"\u01A2\x07\x04\x02\x02\u01A1\u0197\x03\x02\x02\x02\u01A1\u01A2\x03\x02"+
		"\x02\x02\u01A2\u01A3\x03\x02\x02\x02\u01A3\u01A4\x05:\x1E\x02\u01A4\u01A5"+
		"\x07c\x02\x02\u01A59\x03\x02\x02\x02\u01A6\u01A7\x07:\x02\x02\u01A7\u01A8"+
		"\x07\x03\x02\x02\u01A8\u01AD\x05H%\x02\u01A9\u01AA\x07e\x02\x02\u01AA"+
		"\u01AC\x05H%\x02\u01AB\u01A9\x03\x02\x02\x02\u01AC\u01AF\x03\x02\x02\x02"+
		"\u01AD\u01AB\x03\x02\x02\x02\u01AD\u01AE\x03\x02\x02\x02\u01AE\u01B0\x03"+
		"\x02\x02\x02\u01AF\u01AD\x03\x02\x02\x02\u01B0\u01B1\x07\x04\x02\x02\u01B1"+
		"\u01B4\x03\x02\x02\x02\u01B2\u01B4\x05\x1E\x10\x02\u01B3\u01A6\x03\x02"+
		"\x02\x02\u01B3\u01B2\x03\x02\x02\x02\u01B4;\x03\x02\x02\x02\u01B5\u01B6"+
		"\x07L\x02\x02\u01B6\u01B9\x07M\x02\x02\u01B7\u01B9\x07>\x02\x02\u01B8"+
		"\u01B5\x03\x02\x02\x02\u01B8\u01B7\x03\x02\x02\x02\u01B8\u01B9\x03\x02"+
		"\x02\x02\u01B9\u01BA\x03\x02\x02\x02\u01BA\u01BD\x07?\x02\x02\u01BB\u01BD"+
		"\x07e\x02\x02\u01BC\u01B8\x03\x02\x02\x02\u01BC\u01BB\x03\x02\x02\x02"+
		"\u01BD\u01BE\x03\x02\x02\x02\u01BE\u01C1\x05@!\x02\u01BF\u01C0\x07@\x02"+
		"\x02\u01C0\u01C2\x05B\"\x02\u01C1\u01BF\x03\x02\x02\x02\u01C1\u01C2\x03"+
		"\x02\x02\x02\u01C2\u01C5\x03\x02\x02\x02\u01C3\u01C5\x05 \x11\x02\u01C4"+
		"\u01BC\x03\x02\x02\x02\u01C4\u01C3\x03\x02\x02\x02\u01C5=\x03\x02\x02"+
		"\x02\u01C6\u01C7\x07B\x02\x02\u01C7\u01C8\x05B\"\x02\u01C8?\x03\x02\x02"+
		"\x02\u01C9\u01CB\x07a\x02\x02\u01CA\u01C9\x03\x02\x02\x02\u01CA\u01CB"+
		"\x03\x02\x02\x02\u01CB\u01CC\x03\x02\x02\x02\u01CC\u01D1\x07j\x02\x02"+
		"\u01CD\u01CF\x07;\x02\x02\u01CE\u01CD\x03\x02\x02\x02\u01CE\u01CF\x03"+
		"\x02\x02\x02\u01CF\u01D0\x03\x02\x02\x02\u01D0\u01D2\x07j\x02\x02\u01D1"+
		"\u01CE\x03\x02\x02\x02\u01D1\u01D2\x03\x02\x02\x02\u01D2\u01DD\x03\x02"+
		"\x02\x02\u01D3\u01D4\x07\x03\x02\x02\u01D4\u01D5\x05\x1E\x10\x02\u01D5"+
		"\u01DA\x07\x04\x02\x02\u01D6\u01D8\x07;\x02\x02\u01D7\u01D6\x03\x02\x02"+
		"\x02\u01D7\u01D8\x03\x02\x02\x02\u01D8\u01D9\x03\x02\x02\x02\u01D9\u01DB"+
		"\x07j\x02\x02\u01DA\u01D7\x03\x02\x02\x02\u01DA\u01DB\x03\x02\x02\x02"+
		"\u01DB\u01DD\x03\x02\x02\x02\u01DC\u01CA\x03\x02\x02\x02\u01DC\u01D3\x03"+
		"\x02\x02\x02\u01DDA\x03\x02\x02\x02\u01DE\u01DF\b\"\x01\x02\u01DF\u0205"+
		"\x05D#\x02\u01E0\u01E1\x07T\x02\x02\u01E1\u0205\x05B\"\f\u01E2\u01E3\x07"+
		"\x03\x02\x02\u01E3\u01E4\x05B\"\x02\u01E4\u01E5\x07\x04\x02\x02\u01E5"+
		"\u0205\x03\x02\x02\x02\u01E6\u01E7\x07j\x02\x02\u01E7\u01F0\x07\x03\x02"+
		"\x02\u01E8\u01ED\x05B\"\x02\u01E9\u01EA\x07e\x02\x02\u01EA\u01EC\x05B"+
		"\"\x02\u01EB\u01E9\x03\x02\x02\x02\u01EC\u01EF\x03\x02\x02\x02\u01ED\u01EB"+
		"\x03\x02\x02\x02\u01ED\u01EE\x03\x02\x02\x02\u01EE\u01F1\x03\x02\x02\x02"+
		"\u01EF\u01ED\x03\x02\x02\x02\u01F0\u01E8\x03\x02\x02\x02\u01F0\u01F1\x03"+
		"\x02\x02\x02\u01F1\u01F2\x03\x02\x02\x02\u01F2\u0205\x07\x04\x02\x02\u01F3"+
		"\u01F5\x07T\x02\x02\u01F4\u01F3\x03\x02\x02\x02\u01F4\u01F5\x03\x02\x02"+
		"\x02\u01F5\u01F6\x03\x02\x02\x02\u01F6\u01F7\x07C\x02\x02\u01F7\u01F8"+
		"\x07\x03\x02\x02\u01F8\u01F9\x05B\"\x02\u01F9\u01FA\x07\x04\x02\x02\u01FA"+
		"\u0205\x03\x02\x02\x02\u01FB\u01FC\x07N\x02\x02\u01FC\u01FD\x07O\x02\x02"+
		"\u01FD\u01FE\x05B\"\x02\u01FE\u01FF\x07P\x02\x02\u01FF\u0200\x05B\"\x02"+
		"\u0200\u0201\x07Q\x02\x02\u0201\u0202\x05B\"\x02\u0202\u0203\x076\x02"+
		"\x02\u0203\u0205\x03\x02\x02\x02\u0204\u01DE\x03\x02\x02\x02\u0204\u01E0"+
		"\x03\x02\x02\x02\u0204\u01E2\x03\x02\x02\x02\u0204\u01E6\x03\x02\x02\x02"+
		"\u0204\u01F4\x03\x02\x02\x02\u0204\u01FB\x03\x02\x02\x02\u0205\u0220\x03"+
		"\x02\x02\x02\u0206\u020A\f\b\x02\x02\u0207\u020B\x05J&\x02\u0208\u020B"+
		"\x05L\'\x02\u0209\u020B\x05N(\x02\u020A\u0207\x03\x02\x02\x02\u020A\u0208"+
		"\x03\x02\x02\x02\u020A\u0209\x03\x02\x02\x02\u020B\u020C\x03\x02\x02\x02"+
		"\u020C\u020D\x05B\"\t\u020D\u021F\x03\x02\x02\x02\u020E\u020F\f\x03\x02"+
		"\x02\u020F\u0210\x07I\x02\x02\u0210\u021F\x05B\"\x04\u0211\u0214\f\v\x02"+
		"\x02\u0212\u0213\x07f\x02\x02\u0213\u0215\x05B\"\x02\u0214\u0212\x03\x02"+
		"\x02\x02\u0215\u0216\x03\x02\x02\x02\u0216\u0214\x03\x02\x02\x02\u0216"+
		"\u0217\x03\x02\x02\x02\u0217\u021F\x03\x02\x02\x02\u0218\u0219\f\x07\x02"+
		"\x02\u0219\u021A\x07R\x02\x02\u021A\u021F\x07S\x02\x02\u021B\u021C\f\x06"+
		"\x02\x02\u021C\u021D\x07T\x02\x02\u021D\u021F\x07S\x02\x02\u021E\u0206"+
		"\x03\x02\x02\x02\u021E\u020E\x03\x02\x02\x02\u021E\u0211\x03\x02\x02\x02"+
		"\u021E\u0218\x03\x02\x02\x02\u021E\u021B\x03\x02\x02\x02\u021F\u0222\x03"+
		"\x02\x02\x02\u0220\u021E\x03\x02\x02\x02\u0220\u0221\x03\x02\x02\x02\u0221"+
		"C\x03\x02\x02\x02\u0222\u0220\x03\x02\x02\x02\u0223\u0224\x07j\x02\x02"+
		"\u0224\u0226\x07\x06\x02\x02\u0225\u0223\x03\x02\x02\x02\u0225\u0226\x03"+
		"\x02\x02\x02\u0226\u0229\x03\x02\x02\x02\u0227\u022A\x07j\x02\x02\u0228"+
		"\u022A\x07d\x02\x02\u0229\u0227\x03\x02\x02\x02\u0229\u0228\x03\x02\x02"+
		"\x02\u022A\u0231\x03\x02\x02\x02";
	private static readonly _serializedATNSegment1: string =
		"\u022B\u022C\x07\x03\x02\x02\u022C\u022D\x05\x1E\x10\x02\u022D\u022E\x07"+
		"\x04\x02\x02\u022E\u0231\x03\x02\x02\x02\u022F\u0231\x05H%\x02\u0230\u0225"+
		"\x03\x02\x02\x02\u0230\u022B\x03\x02\x02\x02\u0230\u022F\x03\x02\x02\x02"+
		"\u0231E\x03\x02\x02\x02\u0232\u0235\x05B\"\x02\u0233\u0234\x07;\x02\x02"+
		"\u0234\u0236\x07j\x02\x02\u0235\u0233\x03\x02\x02\x02\u0235\u0236\x03"+
		"\x02\x02\x02\u0236G\x03\x02\x02\x02\u0237\u023B\x07h\x02\x02\u0238\u023B"+
		"\x07i\x02\x02\u0239\u023B\x07\x0F\x02\x02\u023A\u0237\x03\x02\x02\x02"+
		"\u023A\u0238\x03\x02\x02\x02\u023A\u0239\x03\x02\x02\x02\u023BI\x03\x02"+
		"\x02\x02\u023C\u023D\t\x05\x02\x02\u023DK\x03\x02\x02\x02\u023E\u023F"+
		"\t\x06\x02\x02\u023FM\x03\x02\x02\x02\u0240\u0241\t\x07\x02\x02\u0241"+
		"O\x03\x02\x02\x02HXZlr}\x89\x8C\x8F\x91\x9B\xA6\xBB\xC1\xC4\xD0\xD7\xDA"+
		"\xDF\xE7\xF0\xF4\xF9\xFC\u0102\u010F\u011A\u0121\u0127\u012B\u0136\u0144"+
		"\u0153\u015A\u0162\u0166\u0169\u016C\u016F\u0171\u017D\u0181\u018D\u0192"+
		"\u019D\u01A1\u01AD\u01B3\u01B8\u01BC\u01C1\u01C4\u01CA\u01CE\u01D1\u01D7"+
		"\u01DA\u01DC\u01ED\u01F0\u01F4\u0204\u020A\u0216\u021E\u0220\u0225\u0229"+
		"\u0230\u0235\u023A";
	public static readonly _serializedATN: string = Utils.join(
		[
			DIELParser._serializedATNSegment0,
			DIELParser._serializedATNSegment1
		],
		""
	);
	public static __ATN: ATN;
	public static get _ATN(): ATN {
		if (!DIELParser.__ATN) {
			DIELParser.__ATN = new ATNDeserializer().deserialize(Utils.toCharArray(DIELParser._serializedATN));
		}

		return DIELParser.__ATN;
	}

}

export class QueriesContext extends ParserRuleContext {
	public viewStmt(): ViewStmtContext[];
	public viewStmt(i: number): ViewStmtContext;
	public viewStmt(i?: number): ViewStmtContext | ViewStmtContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ViewStmtContext);
		} else {
			return this.getRuleContext(i, ViewStmtContext);
		}
	}
	public programStmt(): ProgramStmtContext[];
	public programStmt(i: number): ProgramStmtContext;
	public programStmt(i?: number): ProgramStmtContext | ProgramStmtContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ProgramStmtContext);
		} else {
			return this.getRuleContext(i, ProgramStmtContext);
		}
	}
	public templateStmt(): TemplateStmtContext[];
	public templateStmt(i: number): TemplateStmtContext;
	public templateStmt(i?: number): TemplateStmtContext | TemplateStmtContext[] {
		if (i === undefined) {
			return this.getRuleContexts(TemplateStmtContext);
		} else {
			return this.getRuleContext(i, TemplateStmtContext);
		}
	}
	public insertQuery(): InsertQueryContext[];
	public insertQuery(i: number): InsertQueryContext;
	public insertQuery(i?: number): InsertQueryContext | InsertQueryContext[] {
		if (i === undefined) {
			return this.getRuleContexts(InsertQueryContext);
		} else {
			return this.getRuleContext(i, InsertQueryContext);
		}
	}
	public originalTableStmt(): OriginalTableStmtContext[];
	public originalTableStmt(i: number): OriginalTableStmtContext;
	public originalTableStmt(i?: number): OriginalTableStmtContext | OriginalTableStmtContext[] {
		if (i === undefined) {
			return this.getRuleContexts(OriginalTableStmtContext);
		} else {
			return this.getRuleContext(i, OriginalTableStmtContext);
		}
	}
	public registerTypeUdf(): RegisterTypeUdfContext[];
	public registerTypeUdf(i: number): RegisterTypeUdfContext;
	public registerTypeUdf(i?: number): RegisterTypeUdfContext | RegisterTypeUdfContext[] {
		if (i === undefined) {
			return this.getRuleContexts(RegisterTypeUdfContext);
		} else {
			return this.getRuleContext(i, RegisterTypeUdfContext);
		}
	}
	public dropQuery(): DropQueryContext[];
	public dropQuery(i: number): DropQueryContext;
	public dropQuery(i?: number): DropQueryContext | DropQueryContext[] {
		if (i === undefined) {
			return this.getRuleContexts(DropQueryContext);
		} else {
			return this.getRuleContext(i, DropQueryContext);
		}
	}
	public deleteStmt(): DeleteStmtContext[];
	public deleteStmt(i: number): DeleteStmtContext;
	public deleteStmt(i?: number): DeleteStmtContext | DeleteStmtContext[] {
		if (i === undefined) {
			return this.getRuleContexts(DeleteStmtContext);
		} else {
			return this.getRuleContext(i, DeleteStmtContext);
		}
	}
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_queries; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitQueries) return visitor.visitQueries(this);
		else return visitor.visitChildren(this);
	}
}


export class RegisterTypeUdfContext extends ParserRuleContext {
	public REGISTER(): TerminalNode { return this.getToken(DIELParser.REGISTER, 0); }
	public UDF(): TerminalNode { return this.getToken(DIELParser.UDF, 0); }
	public IDENTIFIER(): TerminalNode { return this.getToken(DIELParser.IDENTIFIER, 0); }
	public TYPE(): TerminalNode { return this.getToken(DIELParser.TYPE, 0); }
	public dataType(): DataTypeContext {
		return this.getRuleContext(0, DataTypeContext);
	}
	public DELIM(): TerminalNode { return this.getToken(DIELParser.DELIM, 0); }
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_registerTypeUdf; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitRegisterTypeUdf) return visitor.visitRegisterTypeUdf(this);
		else return visitor.visitChildren(this);
	}
}


export class TemplateStmtContext extends ParserRuleContext {
	public _templateName: Token;
	public CREATE(): TerminalNode { return this.getToken(DIELParser.CREATE, 0); }
	public TEMPLATE(): TerminalNode { return this.getToken(DIELParser.TEMPLATE, 0); }
	public IDENTIFIER(): TerminalNode[];
	public IDENTIFIER(i: number): TerminalNode;
	public IDENTIFIER(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(DIELParser.IDENTIFIER);
		} else {
			return this.getToken(DIELParser.IDENTIFIER, i);
		}
	}
	public DELIM(): TerminalNode { return this.getToken(DIELParser.DELIM, 0); }
	public selectQuery(): SelectQueryContext | undefined {
		return this.tryGetRuleContext(0, SelectQueryContext);
	}
	public joinClause(): JoinClauseContext | undefined {
		return this.tryGetRuleContext(0, JoinClauseContext);
	}
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_templateStmt; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitTemplateStmt) return visitor.visitTemplateStmt(this);
		else return visitor.visitChildren(this);
	}
}


export class DataTypeContext extends ParserRuleContext {
	public INT(): TerminalNode | undefined { return this.tryGetToken(DIELParser.INT, 0); }
	public TEXT(): TerminalNode | undefined { return this.tryGetToken(DIELParser.TEXT, 0); }
	public BOOLEAN(): TerminalNode | undefined { return this.tryGetToken(DIELParser.BOOLEAN, 0); }
	public DATETIME(): TerminalNode | undefined { return this.tryGetToken(DIELParser.DATETIME, 0); }
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_dataType; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitDataType) return visitor.visitDataType(this);
		else return visitor.visitChildren(this);
	}
}


export class ColumnDefinitionContext extends ParserRuleContext {
	public _columnName: Token;
	public _singleValue: ValueContext;
	public _function: Token;
	public dataType(): DataTypeContext {
		return this.getRuleContext(0, DataTypeContext);
	}
	public IDENTIFIER(): TerminalNode[];
	public IDENTIFIER(i: number): TerminalNode;
	public IDENTIFIER(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(DIELParser.IDENTIFIER);
		} else {
			return this.getToken(DIELParser.IDENTIFIER, i);
		}
	}
	public columnConstraints(): ColumnConstraintsContext[];
	public columnConstraints(i: number): ColumnConstraintsContext;
	public columnConstraints(i?: number): ColumnConstraintsContext | ColumnConstraintsContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ColumnConstraintsContext);
		} else {
			return this.getRuleContext(i, ColumnConstraintsContext);
		}
	}
	public DEFAULT(): TerminalNode | undefined { return this.tryGetToken(DIELParser.DEFAULT, 0); }
	public value(): ValueContext[];
	public value(i: number): ValueContext;
	public value(i?: number): ValueContext | ValueContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ValueContext);
		} else {
			return this.getRuleContext(i, ValueContext);
		}
	}
	public COMMA(): TerminalNode[];
	public COMMA(i: number): TerminalNode;
	public COMMA(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(DIELParser.COMMA);
		} else {
			return this.getToken(DIELParser.COMMA, i);
		}
	}
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_columnDefinition; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitColumnDefinition) return visitor.visitColumnDefinition(this);
		else return visitor.visitChildren(this);
	}
}


export class ConstraintDefinitionContext extends ParserRuleContext {
	public _column: Token;
	public _table: Token;
	public _otherColumn: Token;
	public PRIMARY(): TerminalNode | undefined { return this.tryGetToken(DIELParser.PRIMARY, 0); }
	public KEY(): TerminalNode | undefined { return this.tryGetToken(DIELParser.KEY, 0); }
	public IDENTIFIER(): TerminalNode[];
	public IDENTIFIER(i: number): TerminalNode;
	public IDENTIFIER(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(DIELParser.IDENTIFIER);
		} else {
			return this.getToken(DIELParser.IDENTIFIER, i);
		}
	}
	public UNIQUE(): TerminalNode | undefined { return this.tryGetToken(DIELParser.UNIQUE, 0); }
	public NOT(): TerminalNode | undefined { return this.tryGetToken(DIELParser.NOT, 0); }
	public NULL(): TerminalNode | undefined { return this.tryGetToken(DIELParser.NULL, 0); }
	public FOREIGN(): TerminalNode | undefined { return this.tryGetToken(DIELParser.FOREIGN, 0); }
	public REFERENCES(): TerminalNode | undefined { return this.tryGetToken(DIELParser.REFERENCES, 0); }
	public SINGLE(): TerminalNode | undefined { return this.tryGetToken(DIELParser.SINGLE, 0); }
	public LINE(): TerminalNode | undefined { return this.tryGetToken(DIELParser.LINE, 0); }
	public CHECK(): TerminalNode | undefined { return this.tryGetToken(DIELParser.CHECK, 0); }
	public expr(): ExprContext | undefined {
		return this.tryGetRuleContext(0, ExprContext);
	}
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_constraintDefinition; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitConstraintDefinition) return visitor.visitConstraintDefinition(this);
		else return visitor.visitChildren(this);
	}
}


export class OriginalTableStmtContext extends ParserRuleContext {
	public IDENTIFIER(): TerminalNode { return this.getToken(DIELParser.IDENTIFIER, 0); }
	public relationDefintion(): RelationDefintionContext {
		return this.getRuleContext(0, RelationDefintionContext);
	}
	public DELIM(): TerminalNode { return this.getToken(DIELParser.DELIM, 0); }
	public CREATE(): TerminalNode | undefined { return this.tryGetToken(DIELParser.CREATE, 0); }
	public TABLE(): TerminalNode | undefined { return this.tryGetToken(DIELParser.TABLE, 0); }
	public REGISTER(): TerminalNode | undefined { return this.tryGetToken(DIELParser.REGISTER, 0); }
	public EVENT(): TerminalNode | undefined { return this.tryGetToken(DIELParser.EVENT, 0); }
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_originalTableStmt; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitOriginalTableStmt) return visitor.visitOriginalTableStmt(this);
		else return visitor.visitChildren(this);
	}
}


export class RelationDefintionContext extends ParserRuleContext {
	constructor();
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent?: ParserRuleContext, invokingState?: number) {
		if (parent !== undefined && invokingState !== undefined) {
			super(parent, invokingState);
		} else {
			super();
		}
	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_relationDefintion; }
 
	public copyFrom(ctx: RelationDefintionContext): void {
		super.copyFrom(ctx);
	}
}
export class RelationDefintionCopyContext extends RelationDefintionContext {
	public AS(): TerminalNode { return this.getToken(DIELParser.AS, 0); }
	public IDENTIFIER(): TerminalNode { return this.getToken(DIELParser.IDENTIFIER, 0); }
	constructor(ctx: RelationDefintionContext) { super(); this.copyFrom(ctx); }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitRelationDefintionCopy) return visitor.visitRelationDefintionCopy(this);
		else return visitor.visitChildren(this);
	}
}
export class RelationDefintionDirectContext extends RelationDefintionContext {
	public columnDefinition(): ColumnDefinitionContext[];
	public columnDefinition(i: number): ColumnDefinitionContext;
	public columnDefinition(i?: number): ColumnDefinitionContext | ColumnDefinitionContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ColumnDefinitionContext);
		} else {
			return this.getRuleContext(i, ColumnDefinitionContext);
		}
	}
	public constraintDefinition(): ConstraintDefinitionContext[];
	public constraintDefinition(i: number): ConstraintDefinitionContext;
	public constraintDefinition(i?: number): ConstraintDefinitionContext | ConstraintDefinitionContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ConstraintDefinitionContext);
		} else {
			return this.getRuleContext(i, ConstraintDefinitionContext);
		}
	}
	constructor(ctx: RelationDefintionContext) { super(); this.copyFrom(ctx); }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitRelationDefintionDirect) return visitor.visitRelationDefintionDirect(this);
		else return visitor.visitChildren(this);
	}
}


export class ConstraintClauseContext extends ParserRuleContext {
	public CONSTRAIN(): TerminalNode { return this.getToken(DIELParser.CONSTRAIN, 0); }
	public constraintDefinition(): ConstraintDefinitionContext[];
	public constraintDefinition(i: number): ConstraintDefinitionContext;
	public constraintDefinition(i?: number): ConstraintDefinitionContext | ConstraintDefinitionContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ConstraintDefinitionContext);
		} else {
			return this.getRuleContext(i, ConstraintDefinitionContext);
		}
	}
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_constraintClause; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitConstraintClause) return visitor.visitConstraintClause(this);
		else return visitor.visitChildren(this);
	}
}


export class ColumnConstraintsContext extends ParserRuleContext {
	public UNIQUE(): TerminalNode | undefined { return this.tryGetToken(DIELParser.UNIQUE, 0); }
	public PRIMARY(): TerminalNode | undefined { return this.tryGetToken(DIELParser.PRIMARY, 0); }
	public KEY(): TerminalNode | undefined { return this.tryGetToken(DIELParser.KEY, 0); }
	public NOT(): TerminalNode | undefined { return this.tryGetToken(DIELParser.NOT, 0); }
	public NULL(): TerminalNode | undefined { return this.tryGetToken(DIELParser.NULL, 0); }
	public AUTOINCREMENT(): TerminalNode | undefined { return this.tryGetToken(DIELParser.AUTOINCREMENT, 0); }
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_columnConstraints; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitColumnConstraints) return visitor.visitColumnConstraints(this);
		else return visitor.visitChildren(this);
	}
}


export class ViewStmtContext extends ParserRuleContext {
	public CREATE(): TerminalNode { return this.getToken(DIELParser.CREATE, 0); }
	public IDENTIFIER(): TerminalNode { return this.getToken(DIELParser.IDENTIFIER, 0); }
	public AS(): TerminalNode { return this.getToken(DIELParser.AS, 0); }
	public selectQuery(): SelectQueryContext {
		return this.getRuleContext(0, SelectQueryContext);
	}
	public DELIM(): TerminalNode { return this.getToken(DIELParser.DELIM, 0); }
	public OUTPUT(): TerminalNode | undefined { return this.tryGetToken(DIELParser.OUTPUT, 0); }
	public TABLE(): TerminalNode | undefined { return this.tryGetToken(DIELParser.TABLE, 0); }
	public constraintClause(): ConstraintClauseContext | undefined {
		return this.tryGetRuleContext(0, ConstraintClauseContext);
	}
	public VIEW(): TerminalNode | undefined { return this.tryGetToken(DIELParser.VIEW, 0); }
	public CACHED(): TerminalNode | undefined { return this.tryGetToken(DIELParser.CACHED, 0); }
	public EVENT(): TerminalNode | undefined { return this.tryGetToken(DIELParser.EVENT, 0); }
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_viewStmt; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitViewStmt) return visitor.visitViewStmt(this);
		else return visitor.visitChildren(this);
	}
}


export class ProgramStmtContext extends ParserRuleContext {
	public CREATE(): TerminalNode { return this.getToken(DIELParser.CREATE, 0); }
	public PROGRAM(): TerminalNode { return this.getToken(DIELParser.PROGRAM, 0); }
	public AFTER(): TerminalNode { return this.getToken(DIELParser.AFTER, 0); }
	public IDENTIFIER(): TerminalNode[];
	public IDENTIFIER(i: number): TerminalNode;
	public IDENTIFIER(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(DIELParser.IDENTIFIER);
		} else {
			return this.getToken(DIELParser.IDENTIFIER, i);
		}
	}
	public programBody(): ProgramBodyContext {
		return this.getRuleContext(0, ProgramBodyContext);
	}
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_programStmt; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitProgramStmt) return visitor.visitProgramStmt(this);
		else return visitor.visitChildren(this);
	}
}


export class ProgramBodyContext extends ParserRuleContext {
	public BEGIN(): TerminalNode { return this.getToken(DIELParser.BEGIN, 0); }
	public END(): TerminalNode { return this.getToken(DIELParser.END, 0); }
	public aProgram(): AProgramContext[];
	public aProgram(i: number): AProgramContext;
	public aProgram(i?: number): AProgramContext | AProgramContext[] {
		if (i === undefined) {
			return this.getRuleContexts(AProgramContext);
		} else {
			return this.getRuleContext(i, AProgramContext);
		}
	}
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_programBody; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitProgramBody) return visitor.visitProgramBody(this);
		else return visitor.visitChildren(this);
	}
}


export class AProgramContext extends ParserRuleContext {
	public insertQuery(): InsertQueryContext | undefined {
		return this.tryGetRuleContext(0, InsertQueryContext);
	}
	public selectQuery(): SelectQueryContext | undefined {
		return this.tryGetRuleContext(0, SelectQueryContext);
	}
	public deleteStmt(): DeleteStmtContext | undefined {
		return this.tryGetRuleContext(0, DeleteStmtContext);
	}
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_aProgram; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitAProgram) return visitor.visitAProgram(this);
		else return visitor.visitChildren(this);
	}
}


export class SelectQueryContext extends ParserRuleContext {
	constructor();
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent?: ParserRuleContext, invokingState?: number) {
		if (parent !== undefined && invokingState !== undefined) {
			super(parent, invokingState);
		} else {
			super();
		}
	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_selectQuery; }
 
	public copyFrom(ctx: SelectQueryContext): void {
		super.copyFrom(ctx);
	}
}
export class SelectQueryDirectContext extends SelectQueryContext {
	public selectUnitQuery(): SelectUnitQueryContext {
		return this.getRuleContext(0, SelectUnitQueryContext);
	}
	public compositeSelect(): CompositeSelectContext[];
	public compositeSelect(i: number): CompositeSelectContext;
	public compositeSelect(i?: number): CompositeSelectContext | CompositeSelectContext[] {
		if (i === undefined) {
			return this.getRuleContexts(CompositeSelectContext);
		} else {
			return this.getRuleContext(i, CompositeSelectContext);
		}
	}
	constructor(ctx: SelectQueryContext) { super(); this.copyFrom(ctx); }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitSelectQueryDirect) return visitor.visitSelectQueryDirect(this);
		else return visitor.visitChildren(this);
	}
}
export class SelectQueryTemplateContext extends SelectQueryContext {
	public templateQuery(): TemplateQueryContext {
		return this.getRuleContext(0, TemplateQueryContext);
	}
	constructor(ctx: SelectQueryContext) { super(); this.copyFrom(ctx); }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitSelectQueryTemplate) return visitor.visitSelectQueryTemplate(this);
		else return visitor.visitChildren(this);
	}
}


export class TemplateQueryContext extends ParserRuleContext {
	public _templateName: Token;
	public USE(): TerminalNode { return this.getToken(DIELParser.USE, 0); }
	public TEMPLATE(): TerminalNode { return this.getToken(DIELParser.TEMPLATE, 0); }
	public variableAssignment(): VariableAssignmentContext[];
	public variableAssignment(i: number): VariableAssignmentContext;
	public variableAssignment(i?: number): VariableAssignmentContext | VariableAssignmentContext[] {
		if (i === undefined) {
			return this.getRuleContexts(VariableAssignmentContext);
		} else {
			return this.getRuleContext(i, VariableAssignmentContext);
		}
	}
	public IDENTIFIER(): TerminalNode { return this.getToken(DIELParser.IDENTIFIER, 0); }
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_templateQuery; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitTemplateQuery) return visitor.visitTemplateQuery(this);
		else return visitor.visitChildren(this);
	}
}


export class DropQueryContext extends ParserRuleContext {
	public DROP(): TerminalNode { return this.getToken(DIELParser.DROP, 0); }
	public TABLE(): TerminalNode { return this.getToken(DIELParser.TABLE, 0); }
	public IDENTIFIER(): TerminalNode { return this.getToken(DIELParser.IDENTIFIER, 0); }
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_dropQuery; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitDropQuery) return visitor.visitDropQuery(this);
		else return visitor.visitChildren(this);
	}
}


export class DeleteStmtContext extends ParserRuleContext {
	public DELETE(): TerminalNode { return this.getToken(DIELParser.DELETE, 0); }
	public FROM(): TerminalNode { return this.getToken(DIELParser.FROM, 0); }
	public IDENTIFIER(): TerminalNode { return this.getToken(DIELParser.IDENTIFIER, 0); }
	public WHERE(): TerminalNode | undefined { return this.tryGetToken(DIELParser.WHERE, 0); }
	public expr(): ExprContext | undefined {
		return this.tryGetRuleContext(0, ExprContext);
	}
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_deleteStmt; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitDeleteStmt) return visitor.visitDeleteStmt(this);
		else return visitor.visitChildren(this);
	}
}


export class VariableAssignmentContext extends ParserRuleContext {
	public _variable: Token;
	public _assignment: Token;
	public IDENTIFIER(): TerminalNode { return this.getToken(DIELParser.IDENTIFIER, 0); }
	public STRING(): TerminalNode { return this.getToken(DIELParser.STRING, 0); }
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_variableAssignment; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitVariableAssignment) return visitor.visitVariableAssignment(this);
		else return visitor.visitChildren(this);
	}
}


export class CompositeSelectContext extends ParserRuleContext {
	public setOp(): SetOpContext {
		return this.getRuleContext(0, SetOpContext);
	}
	public selectUnitQuery(): SelectUnitQueryContext {
		return this.getRuleContext(0, SelectUnitQueryContext);
	}
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_compositeSelect; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitCompositeSelect) return visitor.visitCompositeSelect(this);
		else return visitor.visitChildren(this);
	}
}


export class SetOpContext extends ParserRuleContext {
	public UNION(): TerminalNode | undefined { return this.tryGetToken(DIELParser.UNION, 0); }
	public INTERSECT(): TerminalNode | undefined { return this.tryGetToken(DIELParser.INTERSECT, 0); }
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_setOp; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitSetOp) return visitor.visitSetOp(this);
		else return visitor.visitChildren(this);
	}
}


export class SelectUnitQueryContext extends ParserRuleContext {
	public SELECT(): TerminalNode { return this.getToken(DIELParser.SELECT, 0); }
	public selectColumnClause(): SelectColumnClauseContext[];
	public selectColumnClause(i: number): SelectColumnClauseContext;
	public selectColumnClause(i?: number): SelectColumnClauseContext | SelectColumnClauseContext[] {
		if (i === undefined) {
			return this.getRuleContexts(SelectColumnClauseContext);
		} else {
			return this.getRuleContext(i, SelectColumnClauseContext);
		}
	}
	public DISTINCT(): TerminalNode | undefined { return this.tryGetToken(DIELParser.DISTINCT, 0); }
	public FROM(): TerminalNode | undefined { return this.tryGetToken(DIELParser.FROM, 0); }
	public relationReference(): RelationReferenceContext | undefined {
		return this.tryGetRuleContext(0, RelationReferenceContext);
	}
	public joinClause(): JoinClauseContext[];
	public joinClause(i: number): JoinClauseContext;
	public joinClause(i?: number): JoinClauseContext | JoinClauseContext[] {
		if (i === undefined) {
			return this.getRuleContexts(JoinClauseContext);
		} else {
			return this.getRuleContext(i, JoinClauseContext);
		}
	}
	public whereClause(): WhereClauseContext | undefined {
		return this.tryGetRuleContext(0, WhereClauseContext);
	}
	public groupByClause(): GroupByClauseContext | undefined {
		return this.tryGetRuleContext(0, GroupByClauseContext);
	}
	public orderByClause(): OrderByClauseContext | undefined {
		return this.tryGetRuleContext(0, OrderByClauseContext);
	}
	public limitClause(): LimitClauseContext | undefined {
		return this.tryGetRuleContext(0, LimitClauseContext);
	}
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_selectUnitQuery; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitSelectUnitQuery) return visitor.visitSelectUnitQuery(this);
		else return visitor.visitChildren(this);
	}
}


export class WhereClauseContext extends ParserRuleContext {
	public WHERE(): TerminalNode { return this.getToken(DIELParser.WHERE, 0); }
	public expr(): ExprContext {
		return this.getRuleContext(0, ExprContext);
	}
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_whereClause; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitWhereClause) return visitor.visitWhereClause(this);
		else return visitor.visitChildren(this);
	}
}


export class GroupByClauseContext extends ParserRuleContext {
	public GROUP(): TerminalNode { return this.getToken(DIELParser.GROUP, 0); }
	public BY(): TerminalNode { return this.getToken(DIELParser.BY, 0); }
	public expr(): ExprContext[];
	public expr(i: number): ExprContext;
	public expr(i?: number): ExprContext | ExprContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ExprContext);
		} else {
			return this.getRuleContext(i, ExprContext);
		}
	}
	public havingClause(): HavingClauseContext | undefined {
		return this.tryGetRuleContext(0, HavingClauseContext);
	}
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_groupByClause; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitGroupByClause) return visitor.visitGroupByClause(this);
		else return visitor.visitChildren(this);
	}
}


export class HavingClauseContext extends ParserRuleContext {
	public HAVING(): TerminalNode { return this.getToken(DIELParser.HAVING, 0); }
	public expr(): ExprContext {
		return this.getRuleContext(0, ExprContext);
	}
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_havingClause; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitHavingClause) return visitor.visitHavingClause(this);
		else return visitor.visitChildren(this);
	}
}


export class OrderByClauseContext extends ParserRuleContext {
	public ORDER(): TerminalNode { return this.getToken(DIELParser.ORDER, 0); }
	public BY(): TerminalNode { return this.getToken(DIELParser.BY, 0); }
	public orderSpec(): OrderSpecContext[];
	public orderSpec(i: number): OrderSpecContext;
	public orderSpec(i?: number): OrderSpecContext | OrderSpecContext[] {
		if (i === undefined) {
			return this.getRuleContexts(OrderSpecContext);
		} else {
			return this.getRuleContext(i, OrderSpecContext);
		}
	}
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_orderByClause; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitOrderByClause) return visitor.visitOrderByClause(this);
		else return visitor.visitChildren(this);
	}
}


export class OrderSpecContext extends ParserRuleContext {
	public expr(): ExprContext {
		return this.getRuleContext(0, ExprContext);
	}
	public ASC(): TerminalNode | undefined { return this.tryGetToken(DIELParser.ASC, 0); }
	public DESC(): TerminalNode | undefined { return this.tryGetToken(DIELParser.DESC, 0); }
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_orderSpec; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitOrderSpec) return visitor.visitOrderSpec(this);
		else return visitor.visitChildren(this);
	}
}


export class InsertQueryContext extends ParserRuleContext {
	public _relation: Token;
	public _column: Token;
	public INSERT(): TerminalNode { return this.getToken(DIELParser.INSERT, 0); }
	public INTO(): TerminalNode { return this.getToken(DIELParser.INTO, 0); }
	public insertBody(): InsertBodyContext {
		return this.getRuleContext(0, InsertBodyContext);
	}
	public DELIM(): TerminalNode { return this.getToken(DIELParser.DELIM, 0); }
	public IDENTIFIER(): TerminalNode[];
	public IDENTIFIER(i: number): TerminalNode;
	public IDENTIFIER(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(DIELParser.IDENTIFIER);
		} else {
			return this.getToken(DIELParser.IDENTIFIER, i);
		}
	}
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_insertQuery; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitInsertQuery) return visitor.visitInsertQuery(this);
		else return visitor.visitChildren(this);
	}
}


export class InsertBodyContext extends ParserRuleContext {
	constructor();
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent?: ParserRuleContext, invokingState?: number) {
		if (parent !== undefined && invokingState !== undefined) {
			super(parent, invokingState);
		} else {
			super();
		}
	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_insertBody; }
 
	public copyFrom(ctx: InsertBodyContext): void {
		super.copyFrom(ctx);
	}
}
export class InsertBodyDirectContext extends InsertBodyContext {
	public VALUES(): TerminalNode { return this.getToken(DIELParser.VALUES, 0); }
	public value(): ValueContext[];
	public value(i: number): ValueContext;
	public value(i?: number): ValueContext | ValueContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ValueContext);
		} else {
			return this.getRuleContext(i, ValueContext);
		}
	}
	constructor(ctx: InsertBodyContext) { super(); this.copyFrom(ctx); }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitInsertBodyDirect) return visitor.visitInsertBodyDirect(this);
		else return visitor.visitChildren(this);
	}
}
export class InsertBodySelectContext extends InsertBodyContext {
	public selectQuery(): SelectQueryContext {
		return this.getRuleContext(0, SelectQueryContext);
	}
	constructor(ctx: InsertBodyContext) { super(); this.copyFrom(ctx); }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitInsertBodySelect) return visitor.visitInsertBodySelect(this);
		else return visitor.visitChildren(this);
	}
}


export class JoinClauseContext extends ParserRuleContext {
	constructor();
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent?: ParserRuleContext, invokingState?: number) {
		if (parent !== undefined && invokingState !== undefined) {
			super(parent, invokingState);
		} else {
			super();
		}
	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_joinClause; }
 
	public copyFrom(ctx: JoinClauseContext): void {
		super.copyFrom(ctx);
	}
}
export class JoinClauseTemplateContext extends JoinClauseContext {
	public templateQuery(): TemplateQueryContext {
		return this.getRuleContext(0, TemplateQueryContext);
	}
	constructor(ctx: JoinClauseContext) { super(); this.copyFrom(ctx); }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitJoinClauseTemplate) return visitor.visitJoinClauseTemplate(this);
		else return visitor.visitChildren(this);
	}
}
export class JoinClauseBasicContext extends JoinClauseContext {
	public relationReference(): RelationReferenceContext {
		return this.getRuleContext(0, RelationReferenceContext);
	}
	public ON(): TerminalNode | undefined { return this.tryGetToken(DIELParser.ON, 0); }
	public expr(): ExprContext | undefined {
		return this.tryGetRuleContext(0, ExprContext);
	}
	public JOIN(): TerminalNode | undefined { return this.tryGetToken(DIELParser.JOIN, 0); }
	public NATURAL(): TerminalNode | undefined { return this.tryGetToken(DIELParser.NATURAL, 0); }
	public LEFT(): TerminalNode | undefined { return this.tryGetToken(DIELParser.LEFT, 0); }
	public OUTER(): TerminalNode | undefined { return this.tryGetToken(DIELParser.OUTER, 0); }
	constructor(ctx: JoinClauseContext) { super(); this.copyFrom(ctx); }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitJoinClauseBasic) return visitor.visitJoinClauseBasic(this);
		else return visitor.visitChildren(this);
	}
}


export class LimitClauseContext extends ParserRuleContext {
	public LIMIT(): TerminalNode { return this.getToken(DIELParser.LIMIT, 0); }
	public expr(): ExprContext {
		return this.getRuleContext(0, ExprContext);
	}
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_limitClause; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitLimitClause) return visitor.visitLimitClause(this);
		else return visitor.visitChildren(this);
	}
}


export class RelationReferenceContext extends ParserRuleContext {
	constructor();
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent?: ParserRuleContext, invokingState?: number) {
		if (parent !== undefined && invokingState !== undefined) {
			super(parent, invokingState);
		} else {
			super();
		}
	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_relationReference; }
 
	public copyFrom(ctx: RelationReferenceContext): void {
		super.copyFrom(ctx);
	}
}
export class RelationReferenceSubQueryContext extends RelationReferenceContext {
	public _alias: Token;
	public selectQuery(): SelectQueryContext {
		return this.getRuleContext(0, SelectQueryContext);
	}
	public IDENTIFIER(): TerminalNode | undefined { return this.tryGetToken(DIELParser.IDENTIFIER, 0); }
	public AS(): TerminalNode | undefined { return this.tryGetToken(DIELParser.AS, 0); }
	constructor(ctx: RelationReferenceContext) { super(); this.copyFrom(ctx); }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitRelationReferenceSubQuery) return visitor.visitRelationReferenceSubQuery(this);
		else return visitor.visitChildren(this);
	}
}
export class RelationReferenceSimpleContext extends RelationReferenceContext {
	public _relation: Token;
	public _alias: Token;
	public IDENTIFIER(): TerminalNode[];
	public IDENTIFIER(i: number): TerminalNode;
	public IDENTIFIER(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(DIELParser.IDENTIFIER);
		} else {
			return this.getToken(DIELParser.IDENTIFIER, i);
		}
	}
	public LATEST(): TerminalNode | undefined { return this.tryGetToken(DIELParser.LATEST, 0); }
	public AS(): TerminalNode | undefined { return this.tryGetToken(DIELParser.AS, 0); }
	constructor(ctx: RelationReferenceContext) { super(); this.copyFrom(ctx); }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitRelationReferenceSimple) return visitor.visitRelationReferenceSimple(this);
		else return visitor.visitChildren(this);
	}
}


export class ExprContext extends ParserRuleContext {
	constructor();
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent?: ParserRuleContext, invokingState?: number) {
		if (parent !== undefined && invokingState !== undefined) {
			super(parent, invokingState);
		} else {
			super();
		}
	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_expr; }
 
	public copyFrom(ctx: ExprContext): void {
		super.copyFrom(ctx);
	}
}
export class ExprNullContext extends ExprContext {
	public expr(): ExprContext {
		return this.getRuleContext(0, ExprContext);
	}
	public IS(): TerminalNode { return this.getToken(DIELParser.IS, 0); }
	public NULL(): TerminalNode { return this.getToken(DIELParser.NULL, 0); }
	constructor(ctx: ExprContext) { super(); this.copyFrom(ctx); }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitExprNull) return visitor.visitExprNull(this);
		else return visitor.visitChildren(this);
	}
}
export class ExprNotNullContext extends ExprContext {
	public expr(): ExprContext {
		return this.getRuleContext(0, ExprContext);
	}
	public NOT(): TerminalNode { return this.getToken(DIELParser.NOT, 0); }
	public NULL(): TerminalNode { return this.getToken(DIELParser.NULL, 0); }
	constructor(ctx: ExprContext) { super(); this.copyFrom(ctx); }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitExprNotNull) return visitor.visitExprNotNull(this);
		else return visitor.visitChildren(this);
	}
}
export class ExprBinOpContext extends ExprContext {
	public _lhs: ExprContext;
	public _rhs: ExprContext;
	public expr(): ExprContext[];
	public expr(i: number): ExprContext;
	public expr(i?: number): ExprContext | ExprContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ExprContext);
		} else {
			return this.getRuleContext(i, ExprContext);
		}
	}
	public mathOp(): MathOpContext | undefined {
		return this.tryGetRuleContext(0, MathOpContext);
	}
	public compareOp(): CompareOpContext | undefined {
		return this.tryGetRuleContext(0, CompareOpContext);
	}
	public logicOp(): LogicOpContext | undefined {
		return this.tryGetRuleContext(0, LogicOpContext);
	}
	constructor(ctx: ExprContext) { super(); this.copyFrom(ctx); }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitExprBinOp) return visitor.visitExprBinOp(this);
		else return visitor.visitChildren(this);
	}
}
export class ExprExistContext extends ExprContext {
	public EXIST(): TerminalNode { return this.getToken(DIELParser.EXIST, 0); }
	public expr(): ExprContext {
		return this.getRuleContext(0, ExprContext);
	}
	public NOT(): TerminalNode | undefined { return this.tryGetToken(DIELParser.NOT, 0); }
	constructor(ctx: ExprContext) { super(); this.copyFrom(ctx); }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitExprExist) return visitor.visitExprExist(this);
		else return visitor.visitChildren(this);
	}
}
export class ExprSimpleContext extends ExprContext {
	public unitExpr(): UnitExprContext {
		return this.getRuleContext(0, UnitExprContext);
	}
	constructor(ctx: ExprContext) { super(); this.copyFrom(ctx); }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitExprSimple) return visitor.visitExprSimple(this);
		else return visitor.visitChildren(this);
	}
}
export class ExprFunctionContext extends ExprContext {
	public _function: Token;
	public IDENTIFIER(): TerminalNode { return this.getToken(DIELParser.IDENTIFIER, 0); }
	public expr(): ExprContext[];
	public expr(i: number): ExprContext;
	public expr(i?: number): ExprContext | ExprContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ExprContext);
		} else {
			return this.getRuleContext(i, ExprContext);
		}
	}
	public COMMA(): TerminalNode[];
	public COMMA(i: number): TerminalNode;
	public COMMA(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(DIELParser.COMMA);
		} else {
			return this.getToken(DIELParser.COMMA, i);
		}
	}
	constructor(ctx: ExprContext) { super(); this.copyFrom(ctx); }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitExprFunction) return visitor.visitExprFunction(this);
		else return visitor.visitChildren(this);
	}
}
export class ExprInContext extends ExprContext {
	public expr(): ExprContext[];
	public expr(i: number): ExprContext;
	public expr(i?: number): ExprContext | ExprContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ExprContext);
		} else {
			return this.getRuleContext(i, ExprContext);
		}
	}
	public IN(): TerminalNode { return this.getToken(DIELParser.IN, 0); }
	constructor(ctx: ExprContext) { super(); this.copyFrom(ctx); }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitExprIn) return visitor.visitExprIn(this);
		else return visitor.visitChildren(this);
	}
}
export class ExprConcatContext extends ExprContext {
	public expr(): ExprContext[];
	public expr(i: number): ExprContext;
	public expr(i?: number): ExprContext | ExprContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ExprContext);
		} else {
			return this.getRuleContext(i, ExprContext);
		}
	}
	public PIPE(): TerminalNode[];
	public PIPE(i: number): TerminalNode;
	public PIPE(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(DIELParser.PIPE);
		} else {
			return this.getToken(DIELParser.PIPE, i);
		}
	}
	constructor(ctx: ExprContext) { super(); this.copyFrom(ctx); }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitExprConcat) return visitor.visitExprConcat(this);
		else return visitor.visitChildren(this);
	}
}
export class ExprNegateContext extends ExprContext {
	public NOT(): TerminalNode { return this.getToken(DIELParser.NOT, 0); }
	public expr(): ExprContext {
		return this.getRuleContext(0, ExprContext);
	}
	constructor(ctx: ExprContext) { super(); this.copyFrom(ctx); }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitExprNegate) return visitor.visitExprNegate(this);
		else return visitor.visitChildren(this);
	}
}
export class ExprParenthesisContext extends ExprContext {
	public expr(): ExprContext {
		return this.getRuleContext(0, ExprContext);
	}
	constructor(ctx: ExprContext) { super(); this.copyFrom(ctx); }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitExprParenthesis) return visitor.visitExprParenthesis(this);
		else return visitor.visitChildren(this);
	}
}
export class ExprWhenContext extends ExprContext {
	public _cond: ExprContext;
	public _thenValue: ExprContext;
	public _elseValue: ExprContext;
	public CASE(): TerminalNode { return this.getToken(DIELParser.CASE, 0); }
	public WHEN(): TerminalNode { return this.getToken(DIELParser.WHEN, 0); }
	public THEN(): TerminalNode { return this.getToken(DIELParser.THEN, 0); }
	public ELSE(): TerminalNode { return this.getToken(DIELParser.ELSE, 0); }
	public END(): TerminalNode { return this.getToken(DIELParser.END, 0); }
	public expr(): ExprContext[];
	public expr(i: number): ExprContext;
	public expr(i?: number): ExprContext | ExprContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ExprContext);
		} else {
			return this.getRuleContext(i, ExprContext);
		}
	}
	constructor(ctx: ExprContext) { super(); this.copyFrom(ctx); }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitExprWhen) return visitor.visitExprWhen(this);
		else return visitor.visitChildren(this);
	}
}


export class UnitExprContext extends ParserRuleContext {
	constructor();
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent?: ParserRuleContext, invokingState?: number) {
		if (parent !== undefined && invokingState !== undefined) {
			super(parent, invokingState);
		} else {
			super();
		}
	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_unitExpr; }
 
	public copyFrom(ctx: UnitExprContext): void {
		super.copyFrom(ctx);
	}
}
export class UnitExprColumnContext extends UnitExprContext {
	public _relation: Token;
	public _column: Token;
	public STAR(): TerminalNode | undefined { return this.tryGetToken(DIELParser.STAR, 0); }
	public IDENTIFIER(): TerminalNode[];
	public IDENTIFIER(i: number): TerminalNode;
	public IDENTIFIER(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(DIELParser.IDENTIFIER);
		} else {
			return this.getToken(DIELParser.IDENTIFIER, i);
		}
	}
	constructor(ctx: UnitExprContext) { super(); this.copyFrom(ctx); }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitUnitExprColumn) return visitor.visitUnitExprColumn(this);
		else return visitor.visitChildren(this);
	}
}
export class UnitExprSubQueryContext extends UnitExprContext {
	public selectQuery(): SelectQueryContext {
		return this.getRuleContext(0, SelectQueryContext);
	}
	constructor(ctx: UnitExprContext) { super(); this.copyFrom(ctx); }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitUnitExprSubQuery) return visitor.visitUnitExprSubQuery(this);
		else return visitor.visitChildren(this);
	}
}
export class UnitExprValueContext extends UnitExprContext {
	public value(): ValueContext {
		return this.getRuleContext(0, ValueContext);
	}
	constructor(ctx: UnitExprContext) { super(); this.copyFrom(ctx); }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitUnitExprValue) return visitor.visitUnitExprValue(this);
		else return visitor.visitChildren(this);
	}
}


export class SelectColumnClauseContext extends ParserRuleContext {
	public expr(): ExprContext {
		return this.getRuleContext(0, ExprContext);
	}
	public AS(): TerminalNode | undefined { return this.tryGetToken(DIELParser.AS, 0); }
	public IDENTIFIER(): TerminalNode | undefined { return this.tryGetToken(DIELParser.IDENTIFIER, 0); }
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_selectColumnClause; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitSelectColumnClause) return visitor.visitSelectColumnClause(this);
		else return visitor.visitChildren(this);
	}
}


export class ValueContext extends ParserRuleContext {
	constructor();
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent?: ParserRuleContext, invokingState?: number) {
		if (parent !== undefined && invokingState !== undefined) {
			super(parent, invokingState);
		} else {
			super();
		}
	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_value; }
 
	public copyFrom(ctx: ValueContext): void {
		super.copyFrom(ctx);
	}
}
export class ValueBooleanContext extends ValueContext {
	public BOOLEANVAL(): TerminalNode { return this.getToken(DIELParser.BOOLEANVAL, 0); }
	constructor(ctx: ValueContext) { super(); this.copyFrom(ctx); }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitValueBoolean) return visitor.visitValueBoolean(this);
		else return visitor.visitChildren(this);
	}
}
export class ValueNumberContext extends ValueContext {
	public NUMBER(): TerminalNode { return this.getToken(DIELParser.NUMBER, 0); }
	constructor(ctx: ValueContext) { super(); this.copyFrom(ctx); }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitValueNumber) return visitor.visitValueNumber(this);
		else return visitor.visitChildren(this);
	}
}
export class ValueStringContext extends ValueContext {
	public STRING(): TerminalNode { return this.getToken(DIELParser.STRING, 0); }
	constructor(ctx: ValueContext) { super(); this.copyFrom(ctx); }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitValueString) return visitor.visitValueString(this);
		else return visitor.visitChildren(this);
	}
}


export class MathOpContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_mathOp; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitMathOp) return visitor.visitMathOp(this);
		else return visitor.visitChildren(this);
	}
}


export class CompareOpContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_compareOp; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitCompareOp) return visitor.visitCompareOp(this);
		else return visitor.visitChildren(this);
	}
}


export class LogicOpContext extends ParserRuleContext {
	public AND(): TerminalNode | undefined { return this.tryGetToken(DIELParser.AND, 0); }
	public OR(): TerminalNode | undefined { return this.tryGetToken(DIELParser.OR, 0); }
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_logicOp; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitLogicOp) return visitor.visitLogicOp(this);
		else return visitor.visitChildren(this);
	}
}


