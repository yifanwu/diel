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
	public static readonly PREDICATE=16;
	public static readonly CONSTRAIN=17;
	public static readonly TEMPLATE=18;
	public static readonly USE=19;
	public static readonly XCHART=20;
	public static readonly NAME=21;
	public static readonly PUBLIC=22;
	public static readonly SINGLE=23;
	public static readonly LINE=24;
	public static readonly DYNAMIC=25;
	public static readonly REGISTER=26;
	public static readonly TYPE=27;
	public static readonly UDF=28;
	public static readonly CREATE=29;
	public static readonly DEFAULT=30;
	public static readonly EXCEPT=31;
	public static readonly ALL=32;
	public static readonly DROP=33;
	public static readonly CHECK=34;
	public static readonly UNIQUE=35;
	public static readonly PRIMARY=36;
	public static readonly FOREIGN=37;
	public static readonly REFERENCES=38;
	public static readonly KEY=39;
	public static readonly TABLE=40;
	public static readonly VIEW=41;
	public static readonly BOOLEAN=42;
	public static readonly OUTPUT=43;
	public static readonly PROGRAM=44;
	public static readonly AFTER=45;
	public static readonly BEGIN=46;
	public static readonly END=47;
	public static readonly WITH=48;
	public static readonly INSERT=49;
	public static readonly INTO=50;
	public static readonly VALUES=51;
	public static readonly AS=52;
	public static readonly SELECT=53;
	public static readonly FROM=54;
	public static readonly JOIN=55;
	public static readonly ON=56;
	public static readonly WHERE=57;
	public static readonly LIMIT=58;
	public static readonly EXIST=59;
	public static readonly GROUP=60;
	public static readonly BY=61;
	public static readonly HAVING=62;
	public static readonly AND=63;
	public static readonly OR=64;
	public static readonly IN=65;
	public static readonly INTERSECT=66;
	public static readonly UNION=67;
	public static readonly LEFT=68;
	public static readonly OUTER=69;
	public static readonly CASE=70;
	public static readonly WHEN=71;
	public static readonly THEN=72;
	public static readonly ELSE=73;
	public static readonly IS=74;
	public static readonly NULL=75;
	public static readonly NOT=76;
	public static readonly ORDER=77;
	public static readonly ASC=78;
	public static readonly DESC=79;
	public static readonly AUTOINCREMENT=80;
	public static readonly DATETIME=81;
	public static readonly DISTINCT=82;
	public static readonly TRUE=83;
	public static readonly FALSE=84;
	public static readonly CACHED=85;
	public static readonly DELETE=86;
	public static readonly INT=87;
	public static readonly TEXT=88;
	public static readonly LATEST=89;
	public static readonly MINUS=90;
	public static readonly DELIM=91;
	public static readonly STAR=92;
	public static readonly COMMA=93;
	public static readonly PIPE=94;
	public static readonly SIMPLE_COMMENT=95;
	public static readonly NUMBER=96;
	public static readonly STRING=97;
	public static readonly IDENTIFIER=98;
	public static readonly WS=99;
	public static readonly RULE_queries = 0;
	public static readonly RULE_registerTypeUdf = 1;
	public static readonly RULE_templateStmt = 2;
	public static readonly RULE_crossfilterStmt = 3;
	public static readonly RULE_crossfilterChartStmt = 4;
	public static readonly RULE_dataType = 5;
	public static readonly RULE_columnDefinition = 6;
	public static readonly RULE_constraintDefinition = 7;
	public static readonly RULE_originalTableStmt = 8;
	public static readonly RULE_relationDefintion = 9;
	public static readonly RULE_constraintClause = 10;
	public static readonly RULE_columnConstraints = 11;
	public static readonly RULE_viewStmt = 12;
	public static readonly RULE_programStmt = 13;
	public static readonly RULE_programBody = 14;
	public static readonly RULE_aProgram = 15;
	public static readonly RULE_selectQuery = 16;
	public static readonly RULE_templateQuery = 17;
	public static readonly RULE_dropQuery = 18;
	public static readonly RULE_deleteStmt = 19;
	public static readonly RULE_variableAssignment = 20;
	public static readonly RULE_compositeSelect = 21;
	public static readonly RULE_setOp = 22;
	public static readonly RULE_selectUnitQuery = 23;
	public static readonly RULE_whereClause = 24;
	public static readonly RULE_groupByClause = 25;
	public static readonly RULE_havingClause = 26;
	public static readonly RULE_orderByClause = 27;
	public static readonly RULE_orderSpec = 28;
	public static readonly RULE_insertQuery = 29;
	public static readonly RULE_insertBody = 30;
	public static readonly RULE_joinClause = 31;
	public static readonly RULE_limitClause = 32;
	public static readonly RULE_relationReference = 33;
	public static readonly RULE_expr = 34;
	public static readonly RULE_unitExpr = 35;
	public static readonly RULE_selectColumnClause = 36;
	public static readonly RULE_value = 37;
	public static readonly RULE_mathOp = 38;
	public static readonly RULE_compareOp = 39;
	public static readonly RULE_logicOp = 40;
	public static readonly ruleNames: string[] = [
		"queries", "registerTypeUdf", "templateStmt", "crossfilterStmt", "crossfilterChartStmt", 
		"dataType", "columnDefinition", "constraintDefinition", "originalTableStmt", 
		"relationDefintion", "constraintClause", "columnConstraints", "viewStmt", 
		"programStmt", "programBody", "aProgram", "selectQuery", "templateQuery", 
		"dropQuery", "deleteStmt", "variableAssignment", "compositeSelect", "setOp", 
		"selectUnitQuery", "whereClause", "groupByClause", "havingClause", "orderByClause", 
		"orderSpec", "insertQuery", "insertBody", "joinClause", "limitClause", 
		"relationReference", "expr", "unitExpr", "selectColumnClause", "value", 
		"mathOp", "compareOp", "logicOp"
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
		undefined, undefined, "'-'", "';'", "'*'", "','", "'||'"
	];
	private static readonly _SYMBOLIC_NAMES: (string | undefined)[] = [
		undefined, undefined, undefined, undefined, undefined, undefined, undefined, 
		undefined, undefined, undefined, undefined, undefined, undefined, "BOOLEANVAL", 
		"EVENT", "CROSSFILTER", "PREDICATE", "CONSTRAIN", "TEMPLATE", "USE", "XCHART", 
		"NAME", "PUBLIC", "SINGLE", "LINE", "DYNAMIC", "REGISTER", "TYPE", "UDF", 
		"CREATE", "DEFAULT", "EXCEPT", "ALL", "DROP", "CHECK", "UNIQUE", "PRIMARY", 
		"FOREIGN", "REFERENCES", "KEY", "TABLE", "VIEW", "BOOLEAN", "OUTPUT", 
		"PROGRAM", "AFTER", "BEGIN", "END", "WITH", "INSERT", "INTO", "VALUES", 
		"AS", "SELECT", "FROM", "JOIN", "ON", "WHERE", "LIMIT", "EXIST", "GROUP", 
		"BY", "HAVING", "AND", "OR", "IN", "INTERSECT", "UNION", "LEFT", "OUTER", 
		"CASE", "WHEN", "THEN", "ELSE", "IS", "NULL", "NOT", "ORDER", "ASC", "DESC", 
		"AUTOINCREMENT", "DATETIME", "DISTINCT", "TRUE", "FALSE", "CACHED", "DELETE", 
		"INT", "TEXT", "LATEST", "MINUS", "DELIM", "STAR", "COMMA", "PIPE", "SIMPLE_COMMENT", 
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
			this.state = 91; 
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			do {
				{
				this.state = 91;
				this._errHandler.sync(this);
				switch ( this.interpreter.adaptivePredict(this._input,0,this._ctx) ) {
				case 1:
					{
					this.state = 82;
					this.viewStmt();
					}
					break;

				case 2:
					{
					this.state = 83;
					this.programStmt();
					}
					break;

				case 3:
					{
					this.state = 84;
					this.crossfilterStmt();
					}
					break;

				case 4:
					{
					this.state = 85;
					this.templateStmt();
					}
					break;

				case 5:
					{
					this.state = 86;
					this.insertQuery();
					}
					break;

				case 6:
					{
					this.state = 87;
					this.originalTableStmt();
					}
					break;

				case 7:
					{
					this.state = 88;
					this.registerTypeUdf();
					}
					break;

				case 8:
					{
					this.state = 89;
					this.dropQuery();
					}
					break;

				case 9:
					{
					this.state = 90;
					this.deleteStmt();
					}
					break;
				}
				}
				this.state = 93; 
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			} while ( ((((_la - 26)) & ~0x1F) === 0 && ((1 << (_la - 26)) & ((1 << (DIELParser.REGISTER - 26)) | (1 << (DIELParser.CREATE - 26)) | (1 << (DIELParser.DROP - 26)) | (1 << (DIELParser.INSERT - 26)))) !== 0) || _la===DIELParser.DELETE );
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
			this.state = 95;
			this.match(DIELParser.REGISTER);
			this.state = 96;
			this.match(DIELParser.UDF);
			this.state = 97;
			this.match(DIELParser.IDENTIFIER);
			this.state = 98;
			this.match(DIELParser.TYPE);
			this.state = 99;
			this.dataType();
			this.state = 100;
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
			this.state = 102;
			this.match(DIELParser.CREATE);
			this.state = 103;
			this.match(DIELParser.TEMPLATE);
			this.state = 104;
			_localctx._templateName = this.match(DIELParser.IDENTIFIER);
			this.state = 105;
			this.match(DIELParser.T__0);
			this.state = 106;
			this.match(DIELParser.IDENTIFIER);
			this.state = 111;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la===DIELParser.COMMA) {
				{
				{
				this.state = 107;
				this.match(DIELParser.COMMA);
				this.state = 108;
				this.match(DIELParser.IDENTIFIER);
				}
				}
				this.state = 113;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 114;
			this.match(DIELParser.T__1);
			this.state = 117;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input,3,this._ctx) ) {
			case 1:
				{
				this.state = 115;
				this.selectQuery();
				}
				break;

			case 2:
				{
				this.state = 116;
				this.joinClause();
				}
				break;
			}
			this.state = 119;
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
	public crossfilterStmt(): CrossfilterStmtContext {
		let _localctx: CrossfilterStmtContext = new CrossfilterStmtContext(this._ctx, this.state);
		this.enterRule(_localctx, 6, DIELParser.RULE_crossfilterStmt);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 121;
			this.match(DIELParser.CREATE);
			this.state = 122;
			this.match(DIELParser.CROSSFILTER);
			this.state = 123;
			_localctx._crossfilterName = this.match(DIELParser.IDENTIFIER);
			this.state = 124;
			this.match(DIELParser.ON);
			this.state = 125;
			_localctx._relation = this.match(DIELParser.IDENTIFIER);
			this.state = 126;
			this.match(DIELParser.BEGIN);
			this.state = 128; 
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			do {
				{
				{
				this.state = 127;
				this.crossfilterChartStmt();
				}
				}
				this.state = 130; 
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			} while ( _la===DIELParser.CREATE );
			this.state = 132;
			this.match(DIELParser.END);
			this.state = 133;
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
	public crossfilterChartStmt(): CrossfilterChartStmtContext {
		let _localctx: CrossfilterChartStmtContext = new CrossfilterChartStmtContext(this._ctx, this.state);
		this.enterRule(_localctx, 8, DIELParser.RULE_crossfilterChartStmt);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 135;
			this.match(DIELParser.CREATE);
			this.state = 136;
			this.match(DIELParser.XCHART);
			this.state = 137;
			_localctx._chart = this.match(DIELParser.IDENTIFIER);
			this.state = 138;
			this.match(DIELParser.AS);
			this.state = 139;
			_localctx._definitionQuery = this.selectQuery();
			this.state = 140;
			this.match(DIELParser.WITH);
			this.state = 141;
			this.match(DIELParser.PREDICATE);
			this.state = 142;
			_localctx._predicateClause = this.joinClause();
			this.state = 143;
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
		this.enterRule(_localctx, 10, DIELParser.RULE_dataType);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 145;
			_la = this._input.LA(1);
			if ( !(_la===DIELParser.BOOLEAN || ((((_la - 81)) & ~0x1F) === 0 && ((1 << (_la - 81)) & ((1 << (DIELParser.DATETIME - 81)) | (1 << (DIELParser.INT - 81)) | (1 << (DIELParser.TEXT - 81)))) !== 0)) ) {
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
		this.enterRule(_localctx, 12, DIELParser.RULE_columnDefinition);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 147;
			_localctx._columnName = this.match(DIELParser.IDENTIFIER);
			this.state = 148;
			this.dataType();
			this.state = 152;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la===DIELParser.UNIQUE || _la===DIELParser.PRIMARY || _la===DIELParser.NOT || _la===DIELParser.AUTOINCREMENT) {
				{
				{
				this.state = 149;
				this.columnConstraints();
				}
				}
				this.state = 154;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 172;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la===DIELParser.DEFAULT) {
				{
				this.state = 155;
				this.match(DIELParser.DEFAULT);
				this.state = 170;
				this._errHandler.sync(this);
				switch (this._input.LA(1)) {
				case DIELParser.BOOLEANVAL:
				case DIELParser.NUMBER:
				case DIELParser.STRING:
					{
					this.state = 156;
					_localctx._singleValue = this.value();
					}
					break;
				case DIELParser.IDENTIFIER:
					{
					this.state = 157;
					_localctx._function = this.match(DIELParser.IDENTIFIER);
					this.state = 158;
					this.match(DIELParser.T__0);
					this.state = 167;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
					if (_la===DIELParser.BOOLEANVAL || _la===DIELParser.NUMBER || _la===DIELParser.STRING) {
						{
						this.state = 159;
						this.value();
						this.state = 164;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
						while (_la===DIELParser.COMMA) {
							{
							{
							this.state = 160;
							this.match(DIELParser.COMMA);
							this.state = 161;
							this.value();
							}
							}
							this.state = 166;
							this._errHandler.sync(this);
							_la = this._input.LA(1);
						}
						}
					}

					this.state = 169;
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
		this.enterRule(_localctx, 14, DIELParser.RULE_constraintDefinition);
		let _la: number;
		try {
			this.state = 214;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case DIELParser.PRIMARY:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 174;
				this.match(DIELParser.PRIMARY);
				this.state = 175;
				this.match(DIELParser.KEY);
				this.state = 176;
				this.match(DIELParser.T__0);
				this.state = 177;
				this.match(DIELParser.IDENTIFIER);
				this.state = 182;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while (_la===DIELParser.COMMA) {
					{
					{
					this.state = 178;
					this.match(DIELParser.COMMA);
					this.state = 179;
					this.match(DIELParser.IDENTIFIER);
					}
					}
					this.state = 184;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				this.state = 185;
				this.match(DIELParser.T__1);
				}
				break;
			case DIELParser.UNIQUE:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 186;
				this.match(DIELParser.UNIQUE);
				this.state = 187;
				this.match(DIELParser.T__0);
				this.state = 188;
				this.match(DIELParser.IDENTIFIER);
				this.state = 193;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while (_la===DIELParser.COMMA) {
					{
					{
					this.state = 189;
					this.match(DIELParser.COMMA);
					this.state = 190;
					this.match(DIELParser.IDENTIFIER);
					}
					}
					this.state = 195;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				this.state = 196;
				this.match(DIELParser.T__1);
				}
				break;
			case DIELParser.IDENTIFIER:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 197;
				this.match(DIELParser.IDENTIFIER);
				this.state = 198;
				this.match(DIELParser.NOT);
				this.state = 199;
				this.match(DIELParser.NULL);
				}
				break;
			case DIELParser.FOREIGN:
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 200;
				this.match(DIELParser.FOREIGN);
				this.state = 201;
				this.match(DIELParser.KEY);
				this.state = 202;
				this.match(DIELParser.T__0);
				this.state = 203;
				_localctx._column = this.match(DIELParser.IDENTIFIER);
				this.state = 204;
				this.match(DIELParser.T__1);
				this.state = 205;
				this.match(DIELParser.REFERENCES);
				this.state = 206;
				_localctx._table = this.match(DIELParser.IDENTIFIER);
				this.state = 207;
				this.match(DIELParser.T__0);
				this.state = 208;
				_localctx._otherColumn = this.match(DIELParser.IDENTIFIER);
				this.state = 209;
				this.match(DIELParser.T__1);
				}
				break;
			case DIELParser.SINGLE:
				this.enterOuterAlt(_localctx, 5);
				{
				this.state = 210;
				this.match(DIELParser.SINGLE);
				this.state = 211;
				this.match(DIELParser.LINE);
				}
				break;
			case DIELParser.CHECK:
				this.enterOuterAlt(_localctx, 6);
				{
				this.state = 212;
				this.match(DIELParser.CHECK);
				{
				this.state = 213;
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
		this.enterRule(_localctx, 16, DIELParser.RULE_originalTableStmt);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 223;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case DIELParser.REGISTER:
				{
				{
				this.state = 216;
				this.match(DIELParser.REGISTER);
				this.state = 217;
				this.match(DIELParser.TABLE);
				}
				}
				break;
			case DIELParser.CREATE:
				{
				this.state = 218;
				this.match(DIELParser.CREATE);
				this.state = 220;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===DIELParser.EVENT) {
					{
					this.state = 219;
					this.match(DIELParser.EVENT);
					}
				}

				this.state = 222;
				this.match(DIELParser.TABLE);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
			this.state = 225;
			this.match(DIELParser.IDENTIFIER);
			this.state = 226;
			this.relationDefintion();
			this.state = 227;
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
		this.enterRule(_localctx, 18, DIELParser.RULE_relationDefintion);
		let _la: number;
		try {
			let _alt: number;
			this.state = 250;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case DIELParser.T__0:
				_localctx = new RelationDefintionDirectContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 229;
				this.match(DIELParser.T__0);
				this.state = 245;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===DIELParser.IDENTIFIER) {
					{
					this.state = 230;
					this.columnDefinition();
					this.state = 235;
					this._errHandler.sync(this);
					_alt = this.interpreter.adaptivePredict(this._input,15,this._ctx);
					while ( _alt!==2 && _alt!==ATN.INVALID_ALT_NUMBER ) {
						if ( _alt===1 ) {
							{
							{
							this.state = 231;
							this.match(DIELParser.COMMA);
							this.state = 232;
							this.columnDefinition();
							}
							} 
						}
						this.state = 237;
						this._errHandler.sync(this);
						_alt = this.interpreter.adaptivePredict(this._input,15,this._ctx);
					}
					this.state = 242;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
					while (_la===DIELParser.COMMA) {
						{
						{
						this.state = 238;
						this.match(DIELParser.COMMA);
						this.state = 239;
						this.constraintDefinition();
						}
						}
						this.state = 244;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
					}
					}
				}

				this.state = 247;
				this.match(DIELParser.T__1);
				}
				break;
			case DIELParser.AS:
				_localctx = new RelationDefintionCopyContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 248;
				this.match(DIELParser.AS);
				this.state = 249;
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
		this.enterRule(_localctx, 20, DIELParser.RULE_constraintClause);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 252;
			this.match(DIELParser.CONSTRAIN);
			this.state = 253;
			this.constraintDefinition();
			this.state = 258;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la===DIELParser.COMMA) {
				{
				{
				this.state = 254;
				this.match(DIELParser.COMMA);
				this.state = 255;
				this.constraintDefinition();
				}
				}
				this.state = 260;
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
		this.enterRule(_localctx, 22, DIELParser.RULE_columnConstraints);
		try {
			this.state = 267;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case DIELParser.UNIQUE:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 261;
				this.match(DIELParser.UNIQUE);
				}
				break;
			case DIELParser.PRIMARY:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 262;
				this.match(DIELParser.PRIMARY);
				this.state = 263;
				this.match(DIELParser.KEY);
				}
				break;
			case DIELParser.NOT:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 264;
				this.match(DIELParser.NOT);
				this.state = 265;
				this.match(DIELParser.NULL);
				}
				break;
			case DIELParser.AUTOINCREMENT:
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 266;
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
		this.enterRule(_localctx, 24, DIELParser.RULE_viewStmt);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 269;
			this.match(DIELParser.CREATE);
			this.state = 279;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case DIELParser.EVENT:
			case DIELParser.VIEW:
				{
				{
				this.state = 271;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===DIELParser.EVENT) {
					{
					this.state = 270;
					this.match(DIELParser.EVENT);
					}
				}

				this.state = 273;
				this.match(DIELParser.VIEW);
				}
				}
				break;
			case DIELParser.OUTPUT:
				{
				this.state = 274;
				this.match(DIELParser.OUTPUT);
				this.state = 276;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===DIELParser.CACHED) {
					{
					this.state = 275;
					this.match(DIELParser.CACHED);
					}
				}

				}
				break;
			case DIELParser.TABLE:
				{
				this.state = 278;
				this.match(DIELParser.TABLE);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
			this.state = 281;
			this.match(DIELParser.IDENTIFIER);
			this.state = 282;
			this.match(DIELParser.AS);
			this.state = 283;
			this.selectQuery();
			this.state = 285;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la===DIELParser.CONSTRAIN) {
				{
				this.state = 284;
				this.constraintClause();
				}
			}

			this.state = 287;
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
		this.enterRule(_localctx, 26, DIELParser.RULE_programStmt);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 289;
			this.match(DIELParser.CREATE);
			this.state = 290;
			this.match(DIELParser.PROGRAM);
			this.state = 291;
			this.match(DIELParser.AFTER);
			this.state = 292;
			this.match(DIELParser.T__0);
			this.state = 293;
			this.match(DIELParser.IDENTIFIER);
			{
			this.state = 294;
			this.match(DIELParser.COMMA);
			this.state = 295;
			this.match(DIELParser.IDENTIFIER);
			}
			this.state = 297;
			this.match(DIELParser.T__1);
			this.state = 298;
			this.programBody();
			this.state = 299;
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
		this.enterRule(_localctx, 28, DIELParser.RULE_programBody);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 301;
			this.match(DIELParser.BEGIN);
			this.state = 303; 
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			do {
				{
				{
				this.state = 302;
				this.aProgram();
				}
				}
				this.state = 305; 
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			} while ( _la===DIELParser.USE || _la===DIELParser.INSERT || _la===DIELParser.SELECT );
			this.state = 307;
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
		this.enterRule(_localctx, 30, DIELParser.RULE_aProgram);
		try {
			this.state = 311;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case DIELParser.INSERT:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 309;
				this.insertQuery();
				}
				break;
			case DIELParser.USE:
			case DIELParser.SELECT:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 310;
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
	public selectQuery(): SelectQueryContext {
		let _localctx: SelectQueryContext = new SelectQueryContext(this._ctx, this.state);
		this.enterRule(_localctx, 32, DIELParser.RULE_selectQuery);
		let _la: number;
		try {
			this.state = 321;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case DIELParser.SELECT:
				_localctx = new SelectQueryDirectContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 313;
				this.selectUnitQuery();
				this.state = 317;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while (_la===DIELParser.INTERSECT || _la===DIELParser.UNION) {
					{
					{
					this.state = 314;
					this.compositeSelect();
					}
					}
					this.state = 319;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				}
				break;
			case DIELParser.USE:
				_localctx = new SelectQueryTemplateContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 320;
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
		this.enterRule(_localctx, 34, DIELParser.RULE_templateQuery);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 323;
			this.match(DIELParser.USE);
			this.state = 324;
			this.match(DIELParser.TEMPLATE);
			this.state = 325;
			_localctx._templateName = this.match(DIELParser.IDENTIFIER);
			this.state = 326;
			this.match(DIELParser.T__0);
			this.state = 327;
			this.variableAssignment();
			this.state = 332;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la===DIELParser.COMMA) {
				{
				{
				this.state = 328;
				this.match(DIELParser.COMMA);
				this.state = 329;
				this.variableAssignment();
				}
				}
				this.state = 334;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 335;
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
		this.enterRule(_localctx, 36, DIELParser.RULE_dropQuery);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 337;
			this.match(DIELParser.DROP);
			this.state = 338;
			this.match(DIELParser.TABLE);
			this.state = 339;
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
		this.enterRule(_localctx, 38, DIELParser.RULE_deleteStmt);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 341;
			this.match(DIELParser.DELETE);
			this.state = 342;
			this.match(DIELParser.FROM);
			this.state = 343;
			this.match(DIELParser.IDENTIFIER);
			this.state = 346;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la===DIELParser.WHERE) {
				{
				this.state = 344;
				this.match(DIELParser.WHERE);
				this.state = 345;
				this.expr(0);
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
	public variableAssignment(): VariableAssignmentContext {
		let _localctx: VariableAssignmentContext = new VariableAssignmentContext(this._ctx, this.state);
		this.enterRule(_localctx, 40, DIELParser.RULE_variableAssignment);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 348;
			_localctx._variable = this.match(DIELParser.IDENTIFIER);
			this.state = 349;
			this.match(DIELParser.T__2);
			this.state = 350;
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
		this.enterRule(_localctx, 42, DIELParser.RULE_compositeSelect);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 352;
			this.setOp();
			this.state = 353;
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
		this.enterRule(_localctx, 44, DIELParser.RULE_setOp);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 355;
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
		this.enterRule(_localctx, 46, DIELParser.RULE_selectUnitQuery);
		let _la: number;
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 357;
			this.match(DIELParser.SELECT);
			this.state = 359;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la===DIELParser.DISTINCT) {
				{
				this.state = 358;
				this.match(DIELParser.DISTINCT);
				}
			}

			this.state = 361;
			this.selectColumnClause();
			this.state = 366;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la===DIELParser.COMMA) {
				{
				{
				this.state = 362;
				this.match(DIELParser.COMMA);
				this.state = 363;
				this.selectColumnClause();
				}
				}
				this.state = 368;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 389;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la===DIELParser.FROM) {
				{
				this.state = 369;
				this.match(DIELParser.FROM);
				this.state = 370;
				this.relationReference();
				this.state = 374;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input,33,this._ctx);
				while ( _alt!==2 && _alt!==ATN.INVALID_ALT_NUMBER ) {
					if ( _alt===1 ) {
						{
						{
						this.state = 371;
						this.joinClause();
						}
						} 
					}
					this.state = 376;
					this._errHandler.sync(this);
					_alt = this.interpreter.adaptivePredict(this._input,33,this._ctx);
				}
				this.state = 378;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===DIELParser.WHERE) {
					{
					this.state = 377;
					this.whereClause();
					}
				}

				this.state = 381;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===DIELParser.GROUP) {
					{
					this.state = 380;
					this.groupByClause();
					}
				}

				this.state = 384;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===DIELParser.ORDER) {
					{
					this.state = 383;
					this.orderByClause();
					}
				}

				this.state = 387;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===DIELParser.LIMIT) {
					{
					this.state = 386;
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
		this.enterRule(_localctx, 48, DIELParser.RULE_whereClause);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 391;
			this.match(DIELParser.WHERE);
			this.state = 392;
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
		this.enterRule(_localctx, 50, DIELParser.RULE_groupByClause);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 394;
			this.match(DIELParser.GROUP);
			this.state = 395;
			this.match(DIELParser.BY);
			this.state = 396;
			this.expr(0);
			this.state = 401;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la===DIELParser.COMMA) {
				{
				{
				this.state = 397;
				this.match(DIELParser.COMMA);
				this.state = 398;
				this.expr(0);
				}
				}
				this.state = 403;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 405;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la===DIELParser.HAVING) {
				{
				this.state = 404;
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
		this.enterRule(_localctx, 52, DIELParser.RULE_havingClause);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 407;
			this.match(DIELParser.HAVING);
			this.state = 408;
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
		this.enterRule(_localctx, 54, DIELParser.RULE_orderByClause);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 410;
			this.match(DIELParser.ORDER);
			this.state = 411;
			this.match(DIELParser.BY);
			this.state = 412;
			this.orderSpec();
			this.state = 417;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while (_la===DIELParser.COMMA) {
				{
				{
				this.state = 413;
				this.match(DIELParser.COMMA);
				this.state = 414;
				this.orderSpec();
				}
				}
				this.state = 419;
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
		this.enterRule(_localctx, 56, DIELParser.RULE_orderSpec);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 420;
			this.expr(0);
			this.state = 422;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la===DIELParser.ASC || _la===DIELParser.DESC) {
				{
				this.state = 421;
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
		this.enterRule(_localctx, 58, DIELParser.RULE_insertQuery);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 424;
			this.match(DIELParser.INSERT);
			this.state = 425;
			this.match(DIELParser.INTO);
			this.state = 426;
			_localctx._relation = this.match(DIELParser.IDENTIFIER);
			this.state = 437;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la===DIELParser.T__0) {
				{
				this.state = 427;
				this.match(DIELParser.T__0);
				this.state = 428;
				_localctx._column = this.match(DIELParser.IDENTIFIER);
				this.state = 433;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while (_la===DIELParser.COMMA) {
					{
					{
					this.state = 429;
					this.match(DIELParser.COMMA);
					this.state = 430;
					_localctx._column = this.match(DIELParser.IDENTIFIER);
					}
					}
					this.state = 435;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				this.state = 436;
				this.match(DIELParser.T__1);
				}
			}

			this.state = 439;
			this.insertBody();
			this.state = 440;
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
		this.enterRule(_localctx, 60, DIELParser.RULE_insertBody);
		let _la: number;
		try {
			this.state = 455;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case DIELParser.VALUES:
				_localctx = new InsertBodyDirectContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 442;
				this.match(DIELParser.VALUES);
				this.state = 443;
				this.match(DIELParser.T__0);
				this.state = 444;
				this.value();
				this.state = 449;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				while (_la===DIELParser.COMMA) {
					{
					{
					this.state = 445;
					this.match(DIELParser.COMMA);
					this.state = 446;
					this.value();
					}
					}
					this.state = 451;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
				}
				this.state = 452;
				this.match(DIELParser.T__1);
				}
				break;
			case DIELParser.USE:
			case DIELParser.SELECT:
				_localctx = new InsertBodySelectContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 454;
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
		this.enterRule(_localctx, 62, DIELParser.RULE_joinClause);
		let _la: number;
		try {
			this.state = 471;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case DIELParser.JOIN:
			case DIELParser.LEFT:
			case DIELParser.COMMA:
				_localctx = new JoinClauseBasicContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 463;
				this._errHandler.sync(this);
				switch (this._input.LA(1)) {
				case DIELParser.JOIN:
				case DIELParser.LEFT:
					{
					{
					this.state = 459;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
					if (_la===DIELParser.LEFT) {
						{
						this.state = 457;
						this.match(DIELParser.LEFT);
						this.state = 458;
						this.match(DIELParser.OUTER);
						}
					}

					this.state = 461;
					this.match(DIELParser.JOIN);
					}
					}
					break;
				case DIELParser.COMMA:
					{
					this.state = 462;
					this.match(DIELParser.COMMA);
					}
					break;
				default:
					throw new NoViableAltException(this);
				}
				this.state = 465;
				this.relationReference();
				this.state = 468;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===DIELParser.ON) {
					{
					this.state = 466;
					this.match(DIELParser.ON);
					this.state = 467;
					this.expr(0);
					}
				}

				}
				break;
			case DIELParser.USE:
				_localctx = new JoinClauseTemplateContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 470;
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
		this.enterRule(_localctx, 64, DIELParser.RULE_limitClause);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 473;
			this.match(DIELParser.LIMIT);
			this.state = 474;
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
		this.enterRule(_localctx, 66, DIELParser.RULE_relationReference);
		let _la: number;
		try {
			this.state = 495;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case DIELParser.LATEST:
			case DIELParser.IDENTIFIER:
				_localctx = new RelationReferenceSimpleContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				{
				this.state = 477;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===DIELParser.LATEST) {
					{
					this.state = 476;
					this.match(DIELParser.LATEST);
					}
				}

				}
				this.state = 479;
				(_localctx as RelationReferenceSimpleContext)._relation = this.match(DIELParser.IDENTIFIER);
				this.state = 484;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===DIELParser.AS || _la===DIELParser.IDENTIFIER) {
					{
					this.state = 481;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
					if (_la===DIELParser.AS) {
						{
						this.state = 480;
						this.match(DIELParser.AS);
						}
					}

					this.state = 483;
					(_localctx as RelationReferenceSimpleContext)._alias = this.match(DIELParser.IDENTIFIER);
					}
				}

				}
				break;
			case DIELParser.T__0:
				_localctx = new RelationReferenceSubQueryContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 486;
				this.match(DIELParser.T__0);
				this.state = 487;
				this.selectQuery();
				this.state = 488;
				this.match(DIELParser.T__1);
				this.state = 493;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===DIELParser.AS || _la===DIELParser.IDENTIFIER) {
					{
					this.state = 490;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
					if (_la===DIELParser.AS) {
						{
						this.state = 489;
						this.match(DIELParser.AS);
						}
					}

					this.state = 492;
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
		let _startState: number = 68;
		this.enterRecursionRule(_localctx, 68, DIELParser.RULE_expr, _p);
		let _la: number;
		try {
			let _alt: number;
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 535;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input,60,this._ctx) ) {
			case 1:
				{
				_localctx = new ExprSimpleContext(_localctx);
				this._ctx = _localctx;
				_prevctx = _localctx;

				this.state = 498;
				this.unitExpr();
				}
				break;

			case 2:
				{
				_localctx = new ExprNegateContext(_localctx);
				this._ctx = _localctx;
				_prevctx = _localctx;
				this.state = 499;
				this.match(DIELParser.NOT);
				this.state = 500;
				this.expr(10);
				}
				break;

			case 3:
				{
				_localctx = new ExprParenthesisContext(_localctx);
				this._ctx = _localctx;
				_prevctx = _localctx;
				this.state = 501;
				this.match(DIELParser.T__0);
				this.state = 502;
				this.expr(0);
				this.state = 503;
				this.match(DIELParser.T__1);
				}
				break;

			case 4:
				{
				_localctx = new ExprFunctionContext(_localctx);
				this._ctx = _localctx;
				_prevctx = _localctx;
				this.state = 505;
				(_localctx as ExprFunctionContext)._function = this.match(DIELParser.IDENTIFIER);
				this.state = 506;
				this.match(DIELParser.T__0);
				this.state = 515;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===DIELParser.T__0 || _la===DIELParser.BOOLEANVAL || ((((_la - 59)) & ~0x1F) === 0 && ((1 << (_la - 59)) & ((1 << (DIELParser.EXIST - 59)) | (1 << (DIELParser.CASE - 59)) | (1 << (DIELParser.NOT - 59)))) !== 0) || ((((_la - 92)) & ~0x1F) === 0 && ((1 << (_la - 92)) & ((1 << (DIELParser.STAR - 92)) | (1 << (DIELParser.NUMBER - 92)) | (1 << (DIELParser.STRING - 92)) | (1 << (DIELParser.IDENTIFIER - 92)))) !== 0)) {
					{
					this.state = 507;
					this.expr(0);
					this.state = 512;
					this._errHandler.sync(this);
					_la = this._input.LA(1);
					while (_la===DIELParser.COMMA) {
						{
						{
						this.state = 508;
						this.match(DIELParser.COMMA);
						this.state = 509;
						this.expr(0);
						}
						}
						this.state = 514;
						this._errHandler.sync(this);
						_la = this._input.LA(1);
					}
					}
				}

				this.state = 517;
				this.match(DIELParser.T__1);
				}
				break;

			case 5:
				{
				_localctx = new ExprExistContext(_localctx);
				this._ctx = _localctx;
				_prevctx = _localctx;
				this.state = 519;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
				if (_la===DIELParser.NOT) {
					{
					this.state = 518;
					this.match(DIELParser.NOT);
					}
				}

				this.state = 521;
				this.match(DIELParser.EXIST);
				this.state = 522;
				this.match(DIELParser.T__0);
				this.state = 523;
				this.expr(0);
				this.state = 524;
				this.match(DIELParser.T__1);
				}
				break;

			case 6:
				{
				_localctx = new ExprWhenContext(_localctx);
				this._ctx = _localctx;
				_prevctx = _localctx;
				this.state = 526;
				this.match(DIELParser.CASE);
				this.state = 527;
				this.match(DIELParser.WHEN);
				this.state = 528;
				(_localctx as ExprWhenContext)._cond = this.expr(0);
				this.state = 529;
				this.match(DIELParser.THEN);
				this.state = 530;
				(_localctx as ExprWhenContext)._thenValue = this.expr(0);
				this.state = 531;
				this.match(DIELParser.ELSE);
				this.state = 532;
				(_localctx as ExprWhenContext)._elseValue = this.expr(0);
				this.state = 533;
				this.match(DIELParser.END);
				}
				break;
			}
			this._ctx._stop = this._input.tryLT(-1);
			this.state = 563;
			this._errHandler.sync(this);
			_alt = this.interpreter.adaptivePredict(this._input,64,this._ctx);
			while ( _alt!==2 && _alt!==ATN.INVALID_ALT_NUMBER ) {
				if ( _alt===1 ) {
					if ( this._parseListeners!=null ) this.triggerExitRuleEvent();
					_prevctx = _localctx;
					{
					this.state = 561;
					this._errHandler.sync(this);
					switch ( this.interpreter.adaptivePredict(this._input,63,this._ctx) ) {
					case 1:
						{
						_localctx = new ExprBinOpContext(new ExprContext(_parentctx, _parentState));
						(_localctx as ExprBinOpContext)._lhs = _prevctx;
						this.pushNewRecursionContext(_localctx, _startState, DIELParser.RULE_expr);
						this.state = 537;
						if (!(this.precpred(this._ctx, 6))) throw new FailedPredicateException(this, "this.precpred(this._ctx, 6)");
						this.state = 541;
						this._errHandler.sync(this);
						switch (this._input.LA(1)) {
						case DIELParser.T__4:
						case DIELParser.T__5:
						case DIELParser.T__6:
						case DIELParser.MINUS:
						case DIELParser.STAR:
							{
							this.state = 538;
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
							this.state = 539;
							this.compareOp();
							}
							break;
						case DIELParser.AND:
						case DIELParser.OR:
							{
							this.state = 540;
							this.logicOp();
							}
							break;
						default:
							throw new NoViableAltException(this);
						}
						this.state = 543;
						(_localctx as ExprBinOpContext)._rhs = this.expr(7);
						}
						break;

					case 2:
						{
						_localctx = new ExprInContext(new ExprContext(_parentctx, _parentState));
						this.pushNewRecursionContext(_localctx, _startState, DIELParser.RULE_expr);
						this.state = 545;
						if (!(this.precpred(this._ctx, 1))) throw new FailedPredicateException(this, "this.precpred(this._ctx, 1)");
						this.state = 546;
						this.match(DIELParser.IN);
						this.state = 547;
						this.expr(2);
						}
						break;

					case 3:
						{
						_localctx = new ExprConcatContext(new ExprContext(_parentctx, _parentState));
						this.pushNewRecursionContext(_localctx, _startState, DIELParser.RULE_expr);
						this.state = 548;
						if (!(this.precpred(this._ctx, 9))) throw new FailedPredicateException(this, "this.precpred(this._ctx, 9)");
						this.state = 551; 
						this._errHandler.sync(this);
						_alt = 1;
						do {
							switch (_alt) {
							case 1:
								{
								{
								this.state = 549;
								this.match(DIELParser.PIPE);
								this.state = 550;
								this.expr(0);
								}
								}
								break;
							default:
								throw new NoViableAltException(this);
							}
							this.state = 553; 
							this._errHandler.sync(this);
							_alt = this.interpreter.adaptivePredict(this._input,62,this._ctx);
						} while ( _alt!==2 && _alt!==ATN.INVALID_ALT_NUMBER );
						}
						break;

					case 4:
						{
						_localctx = new ExprNullContext(new ExprContext(_parentctx, _parentState));
						this.pushNewRecursionContext(_localctx, _startState, DIELParser.RULE_expr);
						this.state = 555;
						if (!(this.precpred(this._ctx, 5))) throw new FailedPredicateException(this, "this.precpred(this._ctx, 5)");
						this.state = 556;
						this.match(DIELParser.IS);
						this.state = 557;
						this.match(DIELParser.NULL);
						}
						break;

					case 5:
						{
						_localctx = new ExprNotNullContext(new ExprContext(_parentctx, _parentState));
						this.pushNewRecursionContext(_localctx, _startState, DIELParser.RULE_expr);
						this.state = 558;
						if (!(this.precpred(this._ctx, 4))) throw new FailedPredicateException(this, "this.precpred(this._ctx, 4)");
						this.state = 559;
						this.match(DIELParser.NOT);
						this.state = 560;
						this.match(DIELParser.NULL);
						}
						break;
					}
					} 
				}
				this.state = 565;
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
		this.enterRule(_localctx, 70, DIELParser.RULE_unitExpr);
		try {
			this.state = 579;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case DIELParser.STAR:
			case DIELParser.IDENTIFIER:
				_localctx = new UnitExprColumnContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 568;
				this._errHandler.sync(this);
				switch ( this.interpreter.adaptivePredict(this._input,65,this._ctx) ) {
				case 1:
					{
					this.state = 566;
					(_localctx as UnitExprColumnContext)._relation = this.match(DIELParser.IDENTIFIER);
					this.state = 567;
					this.match(DIELParser.T__3);
					}
					break;
				}
				this.state = 572;
				this._errHandler.sync(this);
				switch (this._input.LA(1)) {
				case DIELParser.IDENTIFIER:
					{
					this.state = 570;
					(_localctx as UnitExprColumnContext)._column = this.match(DIELParser.IDENTIFIER);
					}
					break;
				case DIELParser.STAR:
					{
					this.state = 571;
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
				this.state = 574;
				this.match(DIELParser.T__0);
				this.state = 575;
				this.selectQuery();
				this.state = 576;
				this.match(DIELParser.T__1);
				}
				break;
			case DIELParser.BOOLEANVAL:
			case DIELParser.NUMBER:
			case DIELParser.STRING:
				_localctx = new UnitExprValueContext(_localctx);
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 578;
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
		this.enterRule(_localctx, 72, DIELParser.RULE_selectColumnClause);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 581;
			this.expr(0);
			this.state = 584;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la===DIELParser.AS) {
				{
				this.state = 582;
				this.match(DIELParser.AS);
				this.state = 583;
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
		this.enterRule(_localctx, 74, DIELParser.RULE_value);
		try {
			this.state = 589;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case DIELParser.NUMBER:
				_localctx = new ValueNumberContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 586;
				this.match(DIELParser.NUMBER);
				}
				break;
			case DIELParser.STRING:
				_localctx = new ValueStringContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 587;
				this.match(DIELParser.STRING);
				}
				break;
			case DIELParser.BOOLEANVAL:
				_localctx = new ValueBooleanContext(_localctx);
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 588;
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
		this.enterRule(_localctx, 76, DIELParser.RULE_mathOp);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 591;
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
		this.enterRule(_localctx, 78, DIELParser.RULE_compareOp);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 593;
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
		this.enterRule(_localctx, 80, DIELParser.RULE_logicOp);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 595;
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
		case 34:
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
		"\x03\uAF6F\u8320\u479D\uB75C\u4880\u1605\u191C\uAB37\x03e\u0258\x04\x02"+
		"\t\x02\x04\x03\t\x03\x04\x04\t\x04\x04\x05\t\x05\x04\x06\t\x06\x04\x07"+
		"\t\x07\x04\b\t\b\x04\t\t\t\x04\n\t\n\x04\v\t\v\x04\f\t\f\x04\r\t\r\x04"+
		"\x0E\t\x0E\x04\x0F\t\x0F\x04\x10\t\x10\x04\x11\t\x11\x04\x12\t\x12\x04"+
		"\x13\t\x13\x04\x14\t\x14\x04\x15\t\x15\x04\x16\t\x16\x04\x17\t\x17\x04"+
		"\x18\t\x18\x04\x19\t\x19\x04\x1A\t\x1A\x04\x1B\t\x1B\x04\x1C\t\x1C\x04"+
		"\x1D\t\x1D\x04\x1E\t\x1E\x04\x1F\t\x1F\x04 \t \x04!\t!\x04\"\t\"\x04#"+
		"\t#\x04$\t$\x04%\t%\x04&\t&\x04\'\t\'\x04(\t(\x04)\t)\x04*\t*\x03\x02"+
		"\x03\x02\x03\x02\x03\x02\x03\x02\x03\x02\x03\x02\x03\x02\x03\x02\x06\x02"+
		"^\n\x02\r\x02\x0E\x02_\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03"+
		"\x03\x03\x03\x04\x03\x04\x03\x04\x03\x04\x03\x04\x03\x04\x03\x04\x07\x04"+
		"p\n\x04\f\x04\x0E\x04s\v\x04\x03\x04\x03\x04\x03\x04\x05\x04x\n\x04\x03"+
		"\x04\x03\x04\x03\x05\x03\x05\x03\x05\x03\x05\x03\x05\x03\x05\x03\x05\x06"+
		"\x05\x83\n\x05\r\x05\x0E\x05\x84\x03\x05\x03\x05\x03\x05\x03\x06\x03\x06"+
		"\x03\x06\x03\x06\x03\x06\x03\x06\x03\x06\x03\x06\x03\x06\x03\x06\x03\x07"+
		"\x03\x07\x03\b\x03\b\x03\b\x07\b\x99\n\b\f\b\x0E\b\x9C\v\b\x03\b\x03\b"+
		"\x03\b\x03\b\x03\b\x03\b\x03\b\x07\b\xA5\n\b\f\b\x0E\b\xA8\v\b\x05\b\xAA"+
		"\n\b\x03\b\x05\b\xAD\n\b\x05\b\xAF\n\b\x03\t\x03\t\x03\t\x03\t\x03\t\x03"+
		"\t\x07\t\xB7\n\t\f\t\x0E\t\xBA\v\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t"+
		"\x07\t\xC2\n\t\f\t\x0E\t\xC5\v\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03"+
		"\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x03\t\x05"+
		"\t\xD9\n\t\x03\n\x03\n\x03\n\x03\n\x05\n\xDF\n\n\x03\n\x05\n\xE2\n\n\x03"+
		"\n\x03\n\x03\n\x03\n\x03\v\x03\v\x03\v\x03\v\x07\v\xEC\n\v\f\v\x0E\v\xEF"+
		"\v\v\x03\v\x03\v\x07\v\xF3\n\v\f\v\x0E\v\xF6\v\v\x05\v\xF8\n\v\x03\v\x03"+
		"\v\x03\v\x05\v\xFD\n\v\x03\f\x03\f\x03\f\x03\f\x07\f\u0103\n\f\f\f\x0E"+
		"\f\u0106\v\f\x03\r\x03\r\x03\r\x03\r\x03\r\x03\r\x05\r\u010E\n\r\x03\x0E"+
		"\x03\x0E\x05\x0E\u0112\n\x0E\x03\x0E\x03\x0E\x03\x0E\x05\x0E\u0117\n\x0E"+
		"\x03\x0E\x05\x0E\u011A\n\x0E\x03\x0E\x03\x0E\x03\x0E\x03\x0E\x05\x0E\u0120"+
		"\n\x0E\x03\x0E\x03\x0E\x03\x0F\x03\x0F\x03\x0F\x03\x0F\x03\x0F\x03\x0F"+
		"\x03\x0F\x03\x0F\x03\x0F\x03\x0F\x03\x0F\x03\x0F\x03\x10\x03\x10\x06\x10"+
		"\u0132\n\x10\r\x10\x0E\x10\u0133\x03\x10\x03\x10\x03\x11\x03\x11\x05\x11"+
		"\u013A\n\x11\x03\x12\x03\x12\x07\x12\u013E\n\x12\f\x12\x0E\x12\u0141\v"+
		"\x12\x03\x12\x05\x12\u0144\n\x12\x03\x13\x03\x13\x03\x13\x03\x13\x03\x13"+
		"\x03\x13\x03\x13\x07\x13\u014D\n\x13\f\x13\x0E\x13\u0150\v\x13\x03\x13"+
		"\x03\x13\x03\x14\x03\x14\x03\x14\x03\x14\x03\x15\x03\x15\x03\x15\x03\x15"+
		"\x03\x15\x05\x15\u015D\n\x15\x03\x16\x03\x16\x03\x16\x03\x16\x03\x17\x03"+
		"\x17\x03\x17\x03\x18\x03\x18\x03\x19\x03\x19\x05\x19\u016A\n\x19\x03\x19"+
		"\x03\x19\x03\x19\x07\x19\u016F\n\x19\f\x19\x0E\x19\u0172\v\x19\x03\x19"+
		"\x03\x19\x03\x19\x07\x19\u0177\n\x19\f\x19\x0E\x19\u017A\v\x19\x03\x19"+
		"\x05\x19\u017D\n\x19\x03\x19\x05\x19\u0180\n\x19\x03\x19\x05\x19\u0183"+
		"\n\x19\x03\x19\x05\x19\u0186\n\x19\x05\x19\u0188\n\x19\x03\x1A\x03\x1A"+
		"\x03\x1A\x03\x1B\x03\x1B\x03\x1B\x03\x1B\x03\x1B\x07\x1B\u0192\n\x1B\f"+
		"\x1B\x0E\x1B\u0195\v\x1B\x03\x1B\x05\x1B\u0198\n\x1B\x03\x1C\x03\x1C\x03"+
		"\x1C\x03\x1D\x03\x1D\x03\x1D\x03\x1D\x03\x1D\x07\x1D\u01A2\n\x1D\f\x1D"+
		"\x0E\x1D\u01A5\v\x1D\x03\x1E\x03\x1E\x05\x1E\u01A9\n\x1E\x03\x1F\x03\x1F"+
		"\x03\x1F\x03\x1F\x03\x1F\x03\x1F\x03\x1F\x07\x1F\u01B2\n\x1F\f\x1F\x0E"+
		"\x1F\u01B5\v\x1F\x03\x1F\x05\x1F\u01B8\n\x1F\x03\x1F\x03\x1F\x03\x1F\x03"+
		" \x03 \x03 \x03 \x03 \x07 \u01C2\n \f \x0E \u01C5\v \x03 \x03 \x03 \x05"+
		" \u01CA\n \x03!\x03!\x05!\u01CE\n!\x03!\x03!\x05!\u01D2\n!\x03!\x03!\x03"+
		"!\x05!\u01D7\n!\x03!\x05!\u01DA\n!\x03\"\x03\"\x03\"\x03#\x05#\u01E0\n"+
		"#\x03#\x03#\x05#\u01E4\n#\x03#\x05#\u01E7\n#\x03#\x03#\x03#\x03#\x05#"+
		"\u01ED\n#\x03#\x05#\u01F0\n#\x05#\u01F2\n#\x03$\x03$\x03$\x03$\x03$\x03"+
		"$\x03$\x03$\x03$\x03$\x03$\x03$\x03$\x07$\u0201\n$\f$\x0E$\u0204\v$\x05"+
		"$\u0206\n$\x03$\x03$\x05$\u020A\n$\x03$\x03$\x03$\x03$\x03$\x03$\x03$"+
		"\x03$\x03$\x03$\x03$\x03$\x03$\x03$\x05$\u021A\n$\x03$\x03$\x03$\x03$"+
		"\x05$\u0220\n$\x03$\x03$\x03$\x03$\x03$\x03$\x03$\x03$\x06$\u022A\n$\r"+
		"$\x0E$\u022B\x03$\x03$\x03$\x03$\x03$\x03$\x07$\u0234\n$\f$\x0E$\u0237"+
		"\v$\x03%\x03%\x05%\u023B\n%\x03%\x03%\x05%\u023F\n%\x03%\x03%\x03%\x03"+
		"%\x03%\x05%\u0246\n%\x03&\x03&\x03&\x05&\u024B\n&\x03\'\x03\'\x03\'\x05"+
		"\'\u0250\n\'\x03(\x03(\x03)\x03)\x03*\x03*\x03*\x02\x02\x03F+\x02\x02"+
		"\x04\x02\x06\x02\b\x02\n\x02\f\x02\x0E\x02\x10\x02\x12\x02\x14\x02\x16"+
		"\x02\x18\x02\x1A\x02\x1C\x02\x1E\x02 \x02\"\x02$\x02&\x02(\x02*\x02,\x02"+
		".\x020\x022\x024\x026\x028\x02:\x02<\x02>\x02@\x02B\x02D\x02F\x02H\x02"+
		"J\x02L\x02N\x02P\x02R\x02\x02\b\x05\x02,,SSYZ\x03\x02DE\x03\x02PQ\x05"+
		"\x02\x07\t\\\\^^\x04\x02\x05\x05\n\x0E\x03\x02AB\u028C\x02]\x03\x02\x02"+
		"\x02\x04a\x03\x02\x02\x02\x06h\x03\x02\x02\x02\b{\x03\x02\x02\x02\n\x89"+
		"\x03\x02\x02\x02\f\x93\x03\x02\x02\x02\x0E\x95\x03\x02\x02\x02\x10\xD8"+
		"\x03\x02\x02\x02\x12\xE1\x03\x02\x02\x02\x14\xFC\x03\x02\x02\x02\x16\xFE"+
		"\x03\x02\x02\x02\x18\u010D\x03\x02\x02\x02\x1A\u010F\x03\x02\x02\x02\x1C"+
		"\u0123\x03\x02\x02\x02\x1E\u012F\x03\x02\x02\x02 \u0139\x03\x02\x02\x02"+
		"\"\u0143\x03\x02\x02\x02$\u0145\x03\x02\x02\x02&\u0153\x03\x02\x02\x02"+
		"(\u0157\x03\x02\x02\x02*\u015E\x03\x02\x02\x02,\u0162\x03\x02\x02\x02"+
		".\u0165\x03\x02\x02\x020\u0167\x03\x02\x02\x022\u0189\x03\x02\x02\x02"+
		"4\u018C\x03\x02\x02\x026\u0199\x03\x02\x02\x028\u019C\x03\x02\x02\x02"+
		":\u01A6\x03\x02\x02\x02<\u01AA\x03\x02\x02\x02>\u01C9\x03\x02\x02\x02"+
		"@\u01D9\x03\x02\x02\x02B\u01DB\x03\x02\x02\x02D\u01F1\x03\x02\x02\x02"+
		"F\u0219\x03\x02\x02\x02H\u0245\x03\x02\x02\x02J\u0247\x03\x02\x02\x02"+
		"L\u024F\x03\x02\x02\x02N\u0251\x03\x02\x02\x02P\u0253\x03\x02\x02\x02"+
		"R\u0255\x03\x02\x02\x02T^\x05\x1A\x0E\x02U^\x05\x1C\x0F\x02V^\x05\b\x05"+
		"\x02W^\x05\x06\x04\x02X^\x05<\x1F\x02Y^\x05\x12\n\x02Z^\x05\x04\x03\x02"+
		"[^\x05&\x14\x02\\^\x05(\x15\x02]T\x03\x02\x02\x02]U\x03\x02\x02\x02]V"+
		"\x03\x02\x02\x02]W\x03\x02\x02\x02]X\x03\x02\x02\x02]Y\x03\x02\x02\x02"+
		"]Z\x03\x02\x02\x02][\x03\x02\x02\x02]\\\x03\x02\x02\x02^_\x03\x02\x02"+
		"\x02_]\x03\x02\x02\x02_`\x03\x02\x02\x02`\x03\x03\x02\x02\x02ab\x07\x1C"+
		"\x02\x02bc\x07\x1E\x02\x02cd\x07d\x02\x02de\x07\x1D\x02\x02ef\x05\f\x07"+
		"\x02fg\x07]\x02\x02g\x05\x03\x02\x02\x02hi\x07\x1F\x02\x02ij\x07\x14\x02"+
		"\x02jk\x07d\x02\x02kl\x07\x03\x02\x02lq\x07d\x02\x02mn\x07_\x02\x02np"+
		"\x07d\x02\x02om\x03\x02\x02\x02ps\x03\x02\x02\x02qo\x03\x02\x02\x02qr"+
		"\x03\x02\x02\x02rt\x03\x02\x02\x02sq\x03\x02\x02\x02tw\x07\x04\x02\x02"+
		"ux\x05\"\x12\x02vx\x05@!\x02wu\x03\x02\x02\x02wv\x03\x02\x02\x02xy\x03"+
		"\x02\x02\x02yz\x07]\x02\x02z\x07\x03\x02\x02\x02{|\x07\x1F\x02\x02|}\x07"+
		"\x11\x02\x02}~\x07d\x02\x02~\x7F\x07:\x02\x02\x7F\x80\x07d\x02\x02\x80"+
		"\x82\x070\x02\x02\x81\x83\x05\n\x06\x02\x82\x81\x03\x02\x02\x02\x83\x84"+
		"\x03\x02\x02\x02\x84\x82\x03\x02\x02\x02\x84\x85\x03\x02\x02\x02\x85\x86"+
		"\x03\x02\x02\x02\x86\x87\x071\x02\x02\x87\x88\x07]\x02\x02\x88\t\x03\x02"+
		"\x02\x02\x89\x8A\x07\x1F\x02\x02\x8A\x8B\x07\x16\x02\x02\x8B\x8C\x07d"+
		"\x02\x02\x8C\x8D\x076\x02\x02\x8D\x8E\x05\"\x12\x02\x8E\x8F\x072\x02\x02"+
		"\x8F\x90\x07\x12\x02\x02\x90\x91\x05@!\x02\x91\x92\x07]\x02\x02\x92\v"+
		"\x03\x02\x02\x02\x93\x94\t\x02\x02\x02\x94\r\x03\x02\x02\x02\x95\x96\x07"+
		"d\x02\x02\x96\x9A\x05\f\x07\x02\x97\x99\x05\x18\r\x02\x98\x97\x03\x02"+
		"\x02\x02\x99\x9C\x03\x02\x02\x02\x9A\x98\x03\x02\x02\x02\x9A\x9B\x03\x02"+
		"\x02\x02\x9B\xAE\x03\x02\x02\x02\x9C\x9A\x03\x02\x02\x02\x9D\xAC\x07 "+
		"\x02\x02\x9E\xAD\x05L\'\x02\x9F\xA0\x07d\x02\x02\xA0\xA9\x07\x03\x02\x02"+
		"\xA1\xA6\x05L\'\x02\xA2\xA3\x07_\x02\x02\xA3\xA5\x05L\'\x02\xA4\xA2\x03"+
		"\x02\x02\x02\xA5\xA8\x03\x02\x02\x02\xA6\xA4\x03\x02\x02\x02\xA6\xA7\x03"+
		"\x02\x02\x02\xA7\xAA\x03\x02\x02\x02\xA8\xA6\x03\x02\x02\x02\xA9\xA1\x03"+
		"\x02\x02\x02\xA9\xAA\x03\x02\x02\x02\xAA\xAB\x03\x02\x02\x02\xAB\xAD\x07"+
		"\x04\x02\x02\xAC\x9E\x03\x02\x02\x02\xAC\x9F\x03\x02\x02\x02\xAD\xAF\x03"+
		"\x02\x02\x02\xAE\x9D\x03\x02\x02\x02\xAE\xAF\x03\x02\x02\x02\xAF\x0F\x03"+
		"\x02\x02\x02\xB0\xB1\x07&\x02\x02\xB1\xB2\x07)\x02\x02\xB2\xB3\x07\x03"+
		"\x02\x02\xB3\xB8\x07d\x02\x02\xB4\xB5\x07_\x02\x02\xB5\xB7\x07d\x02\x02"+
		"\xB6\xB4\x03\x02\x02\x02\xB7\xBA\x03\x02\x02\x02\xB8\xB6\x03\x02\x02\x02"+
		"\xB8\xB9\x03\x02\x02\x02\xB9\xBB\x03\x02\x02\x02\xBA\xB8\x03\x02\x02\x02"+
		"\xBB\xD9\x07\x04\x02\x02\xBC\xBD\x07%\x02\x02\xBD\xBE\x07\x03\x02\x02"+
		"\xBE\xC3\x07d\x02\x02\xBF\xC0\x07_\x02\x02\xC0\xC2\x07d\x02\x02\xC1\xBF"+
		"\x03\x02\x02\x02\xC2\xC5\x03\x02\x02\x02\xC3\xC1\x03\x02\x02\x02\xC3\xC4"+
		"\x03\x02\x02\x02\xC4\xC6\x03\x02\x02\x02\xC5\xC3\x03\x02\x02\x02\xC6\xD9"+
		"\x07\x04\x02\x02\xC7\xC8\x07d\x02\x02\xC8\xC9\x07N\x02\x02\xC9\xD9\x07"+
		"M\x02\x02\xCA\xCB\x07\'\x02\x02\xCB\xCC\x07)\x02\x02\xCC\xCD\x07\x03\x02"+
		"\x02\xCD\xCE\x07d\x02\x02\xCE\xCF\x07\x04\x02\x02\xCF\xD0\x07(\x02\x02"+
		"\xD0\xD1\x07d\x02\x02\xD1\xD2\x07\x03\x02\x02\xD2\xD3\x07d\x02\x02\xD3"+
		"\xD9\x07\x04\x02\x02\xD4\xD5\x07\x19\x02\x02\xD5\xD9\x07\x1A\x02\x02\xD6"+
		"\xD7\x07$\x02\x02\xD7\xD9\x05F$\x02\xD8\xB0\x03\x02\x02\x02\xD8\xBC\x03"+
		"\x02\x02\x02\xD8\xC7\x03\x02\x02\x02\xD8\xCA\x03\x02\x02\x02\xD8\xD4\x03"+
		"\x02\x02\x02\xD8\xD6\x03\x02\x02\x02\xD9\x11\x03\x02\x02\x02\xDA\xDB\x07"+
		"\x1C\x02\x02\xDB\xE2\x07*\x02\x02\xDC\xDE\x07\x1F\x02\x02\xDD\xDF\x07"+
		"\x10\x02\x02\xDE\xDD\x03\x02\x02\x02\xDE\xDF\x03\x02\x02\x02\xDF\xE0\x03"+
		"\x02\x02\x02\xE0\xE2\x07*\x02\x02\xE1\xDA\x03\x02\x02\x02\xE1\xDC\x03"+
		"\x02\x02\x02\xE2\xE3\x03\x02\x02\x02\xE3\xE4\x07d\x02\x02\xE4\xE5\x05"+
		"\x14\v\x02\xE5\xE6\x07]\x02\x02\xE6\x13\x03\x02\x02\x02\xE7\xF7\x07\x03"+
		"\x02\x02\xE8\xED\x05\x0E\b\x02\xE9\xEA\x07_\x02\x02\xEA\xEC\x05\x0E\b"+
		"\x02\xEB\xE9\x03\x02\x02\x02\xEC\xEF\x03\x02\x02\x02\xED\xEB\x03\x02\x02"+
		"\x02\xED\xEE\x03\x02\x02\x02\xEE\xF4\x03\x02\x02\x02\xEF\xED\x03\x02\x02"+
		"\x02\xF0\xF1\x07_\x02\x02\xF1\xF3\x05\x10\t\x02\xF2\xF0\x03\x02\x02\x02"+
		"\xF3\xF6\x03\x02\x02\x02\xF4\xF2\x03\x02\x02\x02\xF4\xF5\x03\x02\x02\x02"+
		"\xF5\xF8\x03\x02\x02\x02\xF6\xF4\x03\x02\x02\x02\xF7\xE8\x03\x02\x02\x02"+
		"\xF7\xF8\x03\x02\x02\x02\xF8\xF9\x03\x02\x02\x02\xF9\xFD\x07\x04\x02\x02"+
		"\xFA\xFB\x076\x02\x02\xFB\xFD\x07d\x02\x02\xFC\xE7\x03\x02\x02\x02\xFC"+
		"\xFA\x03\x02\x02\x02\xFD\x15\x03\x02\x02\x02\xFE\xFF\x07\x13\x02\x02\xFF"+
		"\u0104\x05\x10\t\x02\u0100\u0101\x07_\x02\x02\u0101\u0103\x05\x10\t\x02"+
		"\u0102\u0100\x03\x02\x02\x02\u0103\u0106\x03\x02\x02\x02\u0104\u0102\x03"+
		"\x02\x02\x02\u0104\u0105\x03\x02\x02\x02\u0105\x17\x03\x02\x02\x02\u0106"+
		"\u0104\x03\x02\x02\x02\u0107\u010E\x07%\x02\x02\u0108\u0109\x07&\x02\x02"+
		"\u0109\u010E\x07)\x02\x02\u010A\u010B\x07N\x02\x02\u010B\u010E\x07M\x02"+
		"\x02\u010C\u010E\x07R\x02\x02\u010D\u0107\x03\x02\x02\x02\u010D\u0108"+
		"\x03\x02\x02\x02\u010D\u010A\x03\x02\x02\x02\u010D\u010C\x03\x02\x02\x02"+
		"\u010E\x19\x03\x02\x02\x02\u010F\u0119\x07\x1F\x02\x02\u0110\u0112\x07"+
		"\x10\x02\x02\u0111\u0110\x03\x02\x02\x02\u0111\u0112\x03\x02\x02\x02\u0112"+
		"\u0113\x03\x02\x02\x02\u0113\u011A\x07+\x02\x02\u0114\u0116\x07-\x02\x02"+
		"\u0115\u0117\x07W\x02\x02\u0116\u0115\x03\x02\x02\x02\u0116\u0117\x03"+
		"\x02\x02\x02\u0117\u011A\x03\x02\x02\x02\u0118\u011A\x07*\x02\x02\u0119"+
		"\u0111\x03\x02\x02\x02\u0119\u0114\x03\x02\x02\x02\u0119\u0118\x03\x02"+
		"\x02\x02\u011A\u011B\x03\x02\x02\x02\u011B\u011C\x07d\x02\x02\u011C\u011D"+
		"\x076\x02\x02\u011D\u011F\x05\"\x12\x02\u011E\u0120\x05\x16\f\x02\u011F"+
		"\u011E\x03\x02\x02\x02\u011F\u0120\x03\x02\x02\x02\u0120\u0121\x03\x02"+
		"\x02\x02\u0121\u0122\x07]\x02\x02\u0122\x1B\x03\x02\x02\x02\u0123\u0124"+
		"\x07\x1F\x02\x02\u0124\u0125\x07.\x02\x02\u0125\u0126\x07/\x02\x02\u0126"+
		"\u0127\x07\x03\x02\x02\u0127\u0128\x07d\x02\x02\u0128\u0129\x07_\x02\x02"+
		"\u0129\u012A\x07d\x02\x02\u012A\u012B\x03\x02\x02\x02\u012B\u012C\x07"+
		"\x04\x02\x02\u012C\u012D\x05\x1E\x10\x02\u012D\u012E\x07]\x02\x02\u012E"+
		"\x1D\x03\x02\x02\x02\u012F\u0131\x070\x02\x02\u0130\u0132\x05 \x11\x02"+
		"\u0131\u0130\x03\x02\x02\x02\u0132\u0133\x03\x02\x02\x02\u0133\u0131\x03"+
		"\x02\x02\x02\u0133\u0134\x03\x02\x02\x02\u0134\u0135\x03\x02\x02\x02\u0135"+
		"\u0136\x071\x02\x02\u0136\x1F\x03\x02\x02\x02\u0137\u013A\x05<\x1F\x02"+
		"\u0138\u013A\x05\"\x12\x02\u0139\u0137\x03\x02\x02\x02\u0139\u0138\x03"+
		"\x02\x02\x02\u013A!\x03\x02\x02\x02\u013B\u013F\x050\x19\x02\u013C\u013E"+
		"\x05,\x17\x02\u013D\u013C\x03\x02\x02\x02\u013E\u0141\x03\x02\x02\x02"+
		"\u013F\u013D\x03\x02\x02\x02\u013F\u0140\x03\x02\x02\x02\u0140\u0144\x03"+
		"\x02\x02\x02\u0141\u013F\x03\x02\x02\x02\u0142\u0144\x05$\x13\x02\u0143"+
		"\u013B\x03\x02\x02\x02\u0143\u0142\x03\x02\x02\x02\u0144#\x03\x02\x02"+
		"\x02\u0145\u0146\x07\x15\x02\x02\u0146\u0147\x07\x14\x02\x02\u0147\u0148"+
		"\x07d\x02\x02\u0148\u0149\x07\x03\x02\x02\u0149\u014E\x05*\x16\x02\u014A"+
		"\u014B\x07_\x02\x02\u014B\u014D\x05*\x16\x02\u014C\u014A\x03\x02\x02\x02"+
		"\u014D\u0150\x03\x02\x02\x02\u014E\u014C\x03\x02\x02\x02\u014E\u014F\x03"+
		"\x02\x02\x02\u014F\u0151\x03\x02\x02\x02\u0150\u014E\x03\x02\x02\x02\u0151"+
		"\u0152\x07\x04\x02\x02\u0152%\x03\x02\x02\x02\u0153\u0154\x07#\x02\x02"+
		"\u0154\u0155\x07*\x02\x02\u0155\u0156\x07d\x02\x02\u0156\'\x03\x02\x02"+
		"\x02\u0157\u0158\x07X\x02\x02\u0158\u0159\x078\x02\x02\u0159\u015C\x07"+
		"d\x02\x02\u015A\u015B\x07;\x02\x02\u015B\u015D\x05F$\x02\u015C\u015A\x03"+
		"\x02\x02\x02\u015C\u015D\x03\x02\x02\x02\u015D)\x03\x02\x02\x02\u015E"+
		"\u015F\x07d\x02\x02\u015F\u0160\x07\x05\x02\x02\u0160\u0161\x07c\x02\x02"+
		"\u0161+\x03\x02\x02\x02\u0162\u0163\x05.\x18\x02\u0163\u0164\x050\x19"+
		"\x02\u0164-\x03\x02\x02\x02\u0165\u0166\t\x03\x02\x02\u0166/\x03\x02\x02"+
		"\x02\u0167\u0169\x077\x02\x02\u0168\u016A\x07T\x02\x02\u0169\u0168\x03"+
		"\x02\x02\x02\u0169\u016A\x03\x02\x02\x02\u016A\u016B\x03\x02\x02\x02\u016B"+
		"\u0170\x05J&\x02\u016C\u016D\x07_\x02\x02\u016D\u016F\x05J&\x02\u016E"+
		"\u016C\x03\x02\x02\x02\u016F\u0172\x03\x02\x02\x02\u0170\u016E\x03\x02"+
		"\x02\x02\u0170\u0171\x03\x02\x02\x02\u0171\u0187\x03\x02\x02\x02\u0172"+
		"\u0170\x03\x02\x02\x02\u0173\u0174\x078\x02\x02\u0174\u0178\x05D#\x02"+
		"\u0175\u0177\x05@!\x02\u0176\u0175\x03\x02\x02\x02\u0177\u017A\x03\x02"+
		"\x02\x02\u0178\u0176\x03\x02\x02\x02\u0178\u0179\x03\x02\x02\x02\u0179"+
		"\u017C\x03\x02\x02\x02\u017A\u0178\x03\x02\x02\x02\u017B\u017D\x052\x1A"+
		"\x02\u017C\u017B\x03\x02\x02\x02\u017C\u017D\x03\x02\x02\x02\u017D\u017F"+
		"\x03\x02\x02\x02\u017E\u0180\x054\x1B\x02\u017F\u017E\x03\x02\x02\x02"+
		"\u017F\u0180\x03\x02\x02\x02\u0180\u0182\x03\x02\x02\x02\u0181\u0183\x05"+
		"8\x1D\x02\u0182\u0181\x03\x02\x02\x02\u0182\u0183\x03\x02\x02\x02\u0183"+
		"\u0185\x03\x02\x02\x02\u0184\u0186\x05B\"\x02\u0185\u0184\x03\x02\x02"+
		"\x02\u0185\u0186\x03\x02\x02\x02\u0186\u0188\x03\x02\x02\x02\u0187\u0173"+
		"\x03\x02\x02\x02\u0187\u0188\x03\x02\x02\x02\u01881\x03\x02\x02\x02\u0189"+
		"\u018A\x07;\x02\x02\u018A\u018B\x05F$\x02\u018B3\x03\x02\x02\x02\u018C"+
		"\u018D\x07>\x02\x02\u018D\u018E\x07?\x02\x02\u018E\u0193\x05F$\x02\u018F"+
		"\u0190\x07_\x02\x02\u0190\u0192\x05F$\x02\u0191\u018F\x03\x02\x02\x02"+
		"\u0192\u0195\x03\x02\x02\x02\u0193\u0191\x03\x02\x02\x02\u0193\u0194\x03"+
		"\x02\x02\x02\u0194\u0197\x03\x02\x02\x02\u0195\u0193\x03\x02\x02\x02\u0196"+
		"\u0198\x056\x1C\x02\u0197\u0196\x03\x02\x02\x02\u0197\u0198\x03\x02\x02"+
		"\x02\u01985\x03\x02\x02\x02\u0199\u019A\x07@\x02\x02\u019A\u019B\x05F"+
		"$\x02\u019B7\x03\x02\x02\x02\u019C\u019D\x07O\x02\x02\u019D\u019E\x07"+
		"?\x02\x02\u019E\u01A3\x05:\x1E\x02\u019F\u01A0\x07_\x02\x02\u01A0\u01A2"+
		"\x05:\x1E\x02\u01A1\u019F\x03\x02\x02\x02\u01A2\u01A5\x03\x02\x02\x02"+
		"\u01A3\u01A1\x03\x02\x02\x02\u01A3\u01A4\x03\x02\x02\x02\u01A49\x03\x02"+
		"\x02\x02\u01A5\u01A3\x03\x02\x02\x02\u01A6\u01A8\x05F$\x02\u01A7\u01A9"+
		"\t\x04\x02\x02\u01A8\u01A7\x03\x02\x02\x02\u01A8\u01A9\x03\x02\x02\x02"+
		"\u01A9;\x03\x02\x02\x02\u01AA\u01AB\x073\x02\x02\u01AB\u01AC\x074\x02"+
		"\x02\u01AC\u01B7\x07d\x02\x02\u01AD\u01AE\x07\x03\x02\x02\u01AE\u01B3"+
		"\x07d\x02\x02\u01AF\u01B0\x07_\x02\x02\u01B0\u01B2\x07d\x02\x02\u01B1"+
		"\u01AF\x03\x02\x02\x02\u01B2\u01B5\x03\x02\x02\x02\u01B3\u01B1\x03\x02"+
		"\x02\x02\u01B3\u01B4\x03\x02\x02\x02\u01B4\u01B6\x03\x02\x02\x02\u01B5"+
		"\u01B3\x03\x02\x02\x02\u01B6\u01B8\x07\x04\x02\x02\u01B7\u01AD\x03\x02"+
		"\x02\x02\u01B7\u01B8\x03\x02\x02\x02\u01B8\u01B9\x03\x02\x02\x02\u01B9"+
		"\u01BA\x05> \x02\u01BA\u01BB\x07]\x02\x02\u01BB=\x03\x02\x02\x02\u01BC"+
		"\u01BD\x075\x02\x02\u01BD\u01BE\x07\x03\x02\x02\u01BE\u01C3\x05L\'\x02"+
		"\u01BF\u01C0\x07_\x02\x02\u01C0\u01C2\x05L\'\x02\u01C1\u01BF\x03\x02\x02"+
		"\x02\u01C2\u01C5\x03\x02\x02\x02\u01C3\u01C1\x03\x02\x02\x02\u01C3\u01C4"+
		"\x03\x02\x02\x02\u01C4\u01C6\x03\x02\x02\x02\u01C5\u01C3\x03\x02\x02\x02"+
		"\u01C6\u01C7\x07\x04\x02\x02\u01C7\u01CA\x03\x02\x02\x02\u01C8\u01CA\x05"+
		"\"\x12\x02\u01C9\u01BC\x03\x02\x02\x02\u01C9\u01C8\x03\x02\x02\x02\u01CA"+
		"?\x03\x02\x02\x02\u01CB\u01CC\x07F\x02\x02\u01CC\u01CE\x07G\x02\x02\u01CD"+
		"\u01CB\x03\x02\x02\x02\u01CD\u01CE\x03\x02\x02\x02\u01CE\u01CF\x03\x02"+
		"\x02\x02\u01CF\u01D2\x079\x02\x02\u01D0\u01D2\x07_\x02\x02\u01D1\u01CD"+
		"\x03\x02\x02\x02\u01D1\u01D0\x03\x02\x02\x02\u01D2\u01D3\x03\x02\x02\x02"+
		"\u01D3\u01D6\x05D#\x02\u01D4\u01D5\x07:\x02\x02\u01D5\u01D7\x05F$\x02"+
		"\u01D6\u01D4\x03\x02\x02\x02\u01D6\u01D7\x03\x02\x02\x02\u01D7\u01DA\x03"+
		"\x02\x02\x02\u01D8\u01DA\x05$\x13\x02\u01D9\u01D1\x03\x02\x02\x02\u01D9"+
		"\u01D8\x03\x02\x02\x02\u01DAA\x03\x02\x02\x02\u01DB\u01DC\x07<\x02\x02"+
		"\u01DC\u01DD\x05F$\x02\u01DDC\x03\x02\x02\x02\u01DE\u01E0\x07[\x02\x02"+
		"\u01DF\u01DE\x03\x02\x02\x02\u01DF\u01E0\x03\x02\x02\x02\u01E0\u01E1\x03"+
		"\x02\x02\x02\u01E1\u01E6\x07d\x02\x02\u01E2\u01E4\x076\x02\x02\u01E3\u01E2"+
		"\x03\x02\x02\x02\u01E3\u01E4\x03\x02\x02\x02\u01E4\u01E5\x03\x02\x02\x02"+
		"\u01E5\u01E7\x07d\x02\x02\u01E6\u01E3\x03\x02\x02\x02\u01E6\u01E7\x03"+
		"\x02\x02\x02\u01E7\u01F2\x03\x02\x02\x02\u01E8\u01E9\x07\x03\x02\x02\u01E9"+
		"\u01EA\x05\"\x12\x02\u01EA\u01EF\x07\x04\x02\x02\u01EB\u01ED\x076\x02"+
		"\x02\u01EC\u01EB\x03\x02\x02\x02\u01EC\u01ED\x03\x02\x02\x02\u01ED\u01EE"+
		"\x03\x02\x02\x02\u01EE\u01F0\x07d\x02\x02\u01EF\u01EC\x03\x02\x02\x02"+
		"\u01EF\u01F0\x03\x02\x02\x02\u01F0\u01F2\x03\x02\x02\x02\u01F1\u01DF\x03"+
		"\x02\x02\x02\u01F1\u01E8\x03\x02\x02\x02\u01F2E\x03\x02\x02\x02\u01F3"+
		"\u01F4\b$\x01\x02\u01F4\u021A\x05H%\x02\u01F5\u01F6\x07N\x02\x02\u01F6"+
		"\u021A\x05F$\f\u01F7\u01F8\x07\x03\x02\x02\u01F8\u01F9\x05F$\x02\u01F9"+
		"\u01FA\x07\x04\x02\x02\u01FA\u021A\x03\x02\x02\x02\u01FB\u01FC\x07d\x02"+
		"\x02\u01FC\u0205\x07\x03\x02\x02\u01FD\u0202\x05F$\x02\u01FE\u01FF\x07"+
		"_\x02\x02\u01FF\u0201\x05F$\x02\u0200\u01FE\x03\x02\x02\x02\u0201\u0204"+
		"\x03\x02\x02\x02\u0202\u0200\x03\x02\x02\x02\u0202\u0203\x03\x02\x02\x02"+
		"\u0203\u0206\x03\x02\x02\x02\u0204\u0202\x03\x02\x02\x02\u0205\u01FD\x03"+
		"\x02\x02\x02\u0205\u0206\x03\x02\x02\x02\u0206\u0207\x03\x02\x02\x02\u0207"+
		"\u021A\x07\x04\x02\x02\u0208\u020A\x07N\x02\x02\u0209\u0208\x03\x02\x02"+
		"\x02\u0209\u020A\x03\x02\x02\x02\u020A\u020B\x03\x02\x02\x02\u020B\u020C"+
		"\x07=\x02\x02\u020C\u020D\x07\x03\x02\x02\u020D\u020E\x05F$\x02\u020E"+
		"\u020F\x07\x04\x02\x02\u020F\u021A\x03\x02\x02\x02\u0210\u0211\x07H\x02"+
		"\x02\u0211\u0212\x07I\x02\x02\u0212\u0213\x05F$\x02\u0213\u0214\x07J\x02"+
		"\x02\u0214\u0215\x05F$\x02\u0215\u0216\x07K\x02\x02\u0216\u0217\x05F$"+
		"\x02\u0217\u0218\x071\x02\x02\u0218\u021A\x03\x02\x02\x02\u0219\u01F3"+
		"\x03\x02\x02\x02\u0219\u01F5\x03\x02\x02\x02\u0219\u01F7\x03\x02\x02\x02"+
		"\u0219\u01FB\x03\x02\x02\x02\u0219\u0209\x03\x02\x02\x02\u0219\u0210\x03"+
		"\x02\x02\x02\u021A\u0235\x03\x02\x02\x02\u021B\u021F\f\b\x02\x02\u021C"+
		"\u0220\x05N(\x02\u021D\u0220\x05P)\x02\u021E\u0220\x05R*\x02\u021F\u021C"+
		"\x03\x02\x02\x02\u021F\u021D\x03\x02\x02\x02\u021F\u021E\x03\x02\x02\x02"+
		"\u0220\u0221\x03\x02\x02\x02\u0221\u0222\x05F$\t\u0222\u0234\x03\x02\x02"+
		"\x02\u0223\u0224\f\x03\x02\x02\u0224\u0225\x07C\x02\x02\u0225\u0234\x05"+
		"F$\x04\u0226\u0229\f\v\x02\x02\u0227\u0228\x07`\x02\x02\u0228\u022A\x05"+
		"F$\x02\u0229\u0227\x03\x02\x02\x02\u022A\u022B\x03\x02\x02\x02\u022B\u0229"+
		"\x03\x02\x02\x02\u022B\u022C\x03\x02\x02\x02\u022C\u0234\x03\x02\x02\x02"+
		"\u022D\u022E";
	private static readonly _serializedATNSegment1: string =
		"\f\x07\x02\x02\u022E\u022F\x07L\x02\x02\u022F\u0234\x07M\x02\x02\u0230"+
		"\u0231\f\x06\x02\x02\u0231\u0232\x07N\x02\x02\u0232\u0234\x07M\x02\x02"+
		"\u0233\u021B\x03\x02\x02\x02\u0233\u0223\x03\x02\x02\x02\u0233\u0226\x03"+
		"\x02\x02\x02\u0233\u022D\x03\x02\x02\x02\u0233\u0230\x03\x02\x02\x02\u0234"+
		"\u0237\x03\x02\x02\x02\u0235\u0233\x03\x02\x02\x02\u0235\u0236\x03\x02"+
		"\x02\x02\u0236G\x03\x02\x02\x02\u0237\u0235\x03\x02\x02\x02\u0238\u0239"+
		"\x07d\x02\x02\u0239\u023B\x07\x06\x02\x02\u023A\u0238\x03\x02\x02\x02"+
		"\u023A\u023B\x03\x02\x02\x02\u023B\u023E\x03\x02\x02\x02\u023C\u023F\x07"+
		"d\x02\x02\u023D\u023F\x07^\x02\x02\u023E\u023C\x03\x02\x02\x02\u023E\u023D"+
		"\x03\x02\x02\x02\u023F\u0246\x03\x02\x02\x02\u0240\u0241\x07\x03\x02\x02"+
		"\u0241\u0242\x05\"\x12\x02\u0242\u0243\x07\x04\x02\x02\u0243\u0246\x03"+
		"\x02\x02\x02\u0244\u0246\x05L\'\x02\u0245\u023A\x03\x02\x02\x02\u0245"+
		"\u0240\x03\x02\x02\x02\u0245\u0244\x03\x02\x02\x02\u0246I\x03\x02\x02"+
		"\x02\u0247\u024A\x05F$\x02\u0248\u0249\x076\x02\x02\u0249\u024B\x07d\x02"+
		"\x02\u024A\u0248\x03\x02\x02\x02\u024A\u024B\x03\x02\x02\x02\u024BK\x03"+
		"\x02\x02\x02\u024C\u0250\x07b\x02\x02\u024D\u0250\x07c\x02\x02\u024E\u0250"+
		"\x07\x0F\x02\x02\u024F\u024C\x03\x02\x02\x02\u024F\u024D\x03\x02\x02\x02"+
		"\u024F\u024E\x03\x02\x02\x02\u0250M\x03\x02\x02\x02\u0251\u0252\t\x05"+
		"\x02\x02\u0252O\x03\x02\x02\x02\u0253\u0254\t\x06\x02\x02\u0254Q\x03\x02"+
		"\x02\x02\u0255\u0256\t\x07\x02\x02\u0256S\x03\x02\x02\x02H]_qw\x84\x9A"+
		"\xA6\xA9\xAC\xAE\xB8\xC3\xD8\xDE\xE1\xED\xF4\xF7\xFC\u0104\u010D\u0111"+
		"\u0116\u0119\u011F\u0133\u0139\u013F\u0143\u014E\u015C\u0169\u0170\u0178"+
		"\u017C\u017F\u0182\u0185\u0187\u0193\u0197\u01A3\u01A8\u01B3\u01B7\u01C3"+
		"\u01C9\u01CD\u01D1\u01D6\u01D9\u01DF\u01E3\u01E6\u01EC\u01EF\u01F1\u0202"+
		"\u0205\u0209\u0219\u021F\u022B\u0233\u0235\u023A\u023E\u0245\u024A\u024F";
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
	public crossfilterStmt(): CrossfilterStmtContext[];
	public crossfilterStmt(i: number): CrossfilterStmtContext;
	public crossfilterStmt(i?: number): CrossfilterStmtContext | CrossfilterStmtContext[] {
		if (i === undefined) {
			return this.getRuleContexts(CrossfilterStmtContext);
		} else {
			return this.getRuleContext(i, CrossfilterStmtContext);
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


export class CrossfilterStmtContext extends ParserRuleContext {
	public _crossfilterName: Token;
	public _relation: Token;
	public CREATE(): TerminalNode { return this.getToken(DIELParser.CREATE, 0); }
	public CROSSFILTER(): TerminalNode { return this.getToken(DIELParser.CROSSFILTER, 0); }
	public ON(): TerminalNode { return this.getToken(DIELParser.ON, 0); }
	public BEGIN(): TerminalNode { return this.getToken(DIELParser.BEGIN, 0); }
	public END(): TerminalNode { return this.getToken(DIELParser.END, 0); }
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
	public crossfilterChartStmt(): CrossfilterChartStmtContext[];
	public crossfilterChartStmt(i: number): CrossfilterChartStmtContext;
	public crossfilterChartStmt(i?: number): CrossfilterChartStmtContext | CrossfilterChartStmtContext[] {
		if (i === undefined) {
			return this.getRuleContexts(CrossfilterChartStmtContext);
		} else {
			return this.getRuleContext(i, CrossfilterChartStmtContext);
		}
	}
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_crossfilterStmt; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitCrossfilterStmt) return visitor.visitCrossfilterStmt(this);
		else return visitor.visitChildren(this);
	}
}


export class CrossfilterChartStmtContext extends ParserRuleContext {
	public _chart: Token;
	public _definitionQuery: SelectQueryContext;
	public _predicateClause: JoinClauseContext;
	public CREATE(): TerminalNode { return this.getToken(DIELParser.CREATE, 0); }
	public XCHART(): TerminalNode { return this.getToken(DIELParser.XCHART, 0); }
	public AS(): TerminalNode { return this.getToken(DIELParser.AS, 0); }
	public WITH(): TerminalNode { return this.getToken(DIELParser.WITH, 0); }
	public PREDICATE(): TerminalNode { return this.getToken(DIELParser.PREDICATE, 0); }
	public DELIM(): TerminalNode { return this.getToken(DIELParser.DELIM, 0); }
	public IDENTIFIER(): TerminalNode { return this.getToken(DIELParser.IDENTIFIER, 0); }
	public selectQuery(): SelectQueryContext {
		return this.getRuleContext(0, SelectQueryContext);
	}
	public joinClause(): JoinClauseContext {
		return this.getRuleContext(0, JoinClauseContext);
	}
	constructor(parent: ParserRuleContext, invokingState: number);
	constructor(parent: ParserRuleContext, invokingState: number) {
		super(parent, invokingState);

	}
	@Override public get ruleIndex(): number { return DIELParser.RULE_crossfilterChartStmt; }
	@Override
	public accept<Result>(visitor: DIELVisitor<Result>): Result {
		if (visitor.visitCrossfilterChartStmt) return visitor.visitCrossfilterChartStmt(this);
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


