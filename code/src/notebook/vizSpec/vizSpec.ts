import { DerivedRelation, DataType, CompositeSelectionUnit, SelectionUnit, ColumnSelection, SetOperator, AstType, RelationReference } from "../../parser/dielAstTypes";
import DielRuntime from "../../runtime/DielRuntime";
import { ChartType, RelationObject } from "../../runtime/runtimeTypes";
import { ExprType, ExprFunAst, FunctionType, ExprColumnAst, ExprValAst } from "../../parser/exprAstTypes";
import { generateSelectionUnit, generateSqlViews } from "../../compiler/codegen/codeGenSql";
import { RelationQuery, SqlRelationType } from "../../compiler/codegen/createSqlIr";
import * as d3ScaleChromatic from "d3-scale-chromatic";
import { text } from "d3";
import { getSelectionUnitAst } from "../../compiler/compiler";

export interface VizLayout {
  chartHeight: number;
  chartWidth: number;
  marginBottom: number;
  marginRight: number;
  marginTop: number;
  marginLeft: number;
}

export interface ChartPropShared {
  layout?: VizLayout;
  svgClickHandler?: () => void;
  colorSpec?: {
    selected?: string,
    default?: string,
    // the following is to support multiple series
    defaultMultiple?: string[];
  };
}

export const DefaultColorSpec = {
  selected: "orange",
  default: "steelblue",
  // max out at 10, in whcih case we complain
  defaultMultiple: d3ScaleChromatic.schemeCategory10
};

interface ChartSpecBase {
  chartType: ChartType;
  dimension: number;
  relationName: string;
}

export type ChartSpecWithQuery = ChartSpec2DWithQuery;


export interface ChartSpecBase2D extends ChartSpecBase {
  xAttribute: string;
  yAttribute: string;
}

export interface ChartSpec2DWithQuery extends ChartSpecBase2D {
  modifiedQuery: DerivedRelation;
}

/**
 * overloading map data with this, since lat/long is also just x and y, after some projection
 */
export interface ChartSpec2DWithData extends ChartSpecBase2D {
  data: RelationObject;
}

export interface ChartSpec3DWithData extends ChartSpec2DWithData {
  zAttribute: string;
}

export type ChartSpecWithData = ChartSpec2DWithData | ChartSpec3DWithData;

export type DielSelection = OneDimSelection | TwoDimSelection;

// both have well defined comparison semantics in SQLite
export type FilterValueType = number | string;

export enum SelectionType {
  OneDim = "OneDim",
  TwoDim = "TwoDim"
}


export type TwoDimSelection = {
  brushBoxType: SelectionType;
  minX: FilterValueType;
  maxX: FilterValueType;
  minY: FilterValueType;
  maxY: FilterValueType;
};

export type OneDimSelection = {
  brushBoxType: SelectionType;
  min: FilterValueType;
  max: FilterValueType;
};

export const DefaultVizLayout = {
  chartHeight: 300,
  chartWidth: 400,
  marginBottom: 20,
  marginRight: 20,
  marginTop: 20,
  marginLeft: 40,
};

export interface VizSpec {
  chartType: ChartType;
  modifiedQuery: DerivedRelation;
  xAxisColumn: string;
  yAxisColumn: string;
}

// handles queries without joins only
export function generateVizSpecForSingleQuery(rt: DielRuntime, q: DerivedRelation): VizSpec {
  let selection: CompositeSelectionUnit = q.selection.compositeSelections[0]; // TODO: multiple composite selections
  let columnSelections: ColumnSelection[] = selection.relation.derivedColumnSelections; //
  let spec: VizSpec = null;
  let query_copy: DerivedRelation = JSON.parse(JSON.stringify(q));
  let timeColumns: ColumnSelection[] = [];
  let numericColumns: ColumnSelection[] = [];
  let textColumns: ColumnSelection[] = [];
  let uselessColumns: ColumnSelection[] = [];

  query_copy.selection.compositeSelections[0].relation.whereClause = null;
  query_copy.selection.compositeSelections[0].relation.joinClauses = null;

  for (let c of columnSelections) {
    if (c.expr.dataType === DataType.TimeStamp) {
      timeColumns.push(c);
    } else if (c.expr.dataType === DataType.Number) {
      numericColumns.push(c);
    } else if (c.expr.dataType === DataType.String) {
      textColumns.push(c);
    } else {
      uselessColumns.push(c);
    }
  }
  if (timeColumns.length + numericColumns.length === 0) {
    return spec;
  } else if (timeColumns.length + numericColumns.length + textColumns.length === 1) {

    let combined = timeColumns.concat(numericColumns).concat(textColumns);
    let columnName = (combined[0].alias) ? combined[0].alias : "column";
    combined[0].alias = columnName;
    let count = {
      exprType: ExprType.Func,
      dataType: DataType.Number,
      functionType: FunctionType.Custom,
      functionReference: "COUNT",
      args: []
    } as ExprFunAst;
    let uniqueValues: SelectionUnit = {
      isDistinct: true,
      columnSelections: combined,
      baseRelation: selection.relation.baseRelation,
    };
    const query_str = generateSelectionUnit(uniqueValues);
    const r = rt.db.exec(query_str);
    let n = r.values.length;
    let selectionUnitAst: SelectionUnit;
    if (n <= 10) {
      selectionUnitAst = singleColumnFewDistinct(combined[0], selection.relation.baseRelation);
    }
    if (n > 10) {
      if (textColumns.length !== 0) {
        selectionUnitAst = oneTextColumnMany(combined[0], selection.relation.baseRelation);
      } else {
        selectionUnitAst = oneNumericColumnMany(combined[0], selection.relation.baseRelation, rt);
      }
    }
    const s = JSON.stringify(Math.random());
    query_copy.name = query_copy.name + s;
    query_copy.selection = {
      astType: AstType.RelationSelection,
      compositeSelections: [{op: SetOperator.NA, relation: selectionUnitAst}]
    };
    spec = {
      chartType: ChartType.BarChart,
      modifiedQuery: query_copy,
      xAxisColumn: columnName,
      yAxisColumn: "quantity"
    };
  } else if (timeColumns.length + numericColumns.length === 2) {
    if (!(timeColumns.length === 0)) {
      query_copy.selection.compositeSelections[0].relation.columnSelections = [timeColumns[0], numericColumns[0]];
      spec = {
        chartType: ChartType.LineChart,
        modifiedQuery: query_copy,
        xAxisColumn: (timeColumns[0].alias) ?  timeColumns[0].alias : "time",
        yAxisColumn: (numericColumns[0].alias) ? numericColumns[0].alias : "attribute"
      };
    } else {
      query_copy.selection.compositeSelections[0].relation.columnSelections = [numericColumns[0], numericColumns[1]];
      spec = {
        chartType: ChartType.Scatter,
        modifiedQuery: query_copy,
        xAxisColumn: (timeColumns[0].alias) ?  timeColumns[0].alias : "attribute1",
        yAxisColumn: (numericColumns[0].alias) ? numericColumns[0].alias : "attribute2"
      };
    }
  } else if (timeColumns.length + numericColumns.length === 3) {
    let combined: ColumnSelection[] = timeColumns.concat(numericColumns);
    let max = {
      exprType: ExprType.Func,
      dataType: DataType.Number,
      functionType: FunctionType.Custom,
      functionReference: "MAX",
      args: [combined[2].expr]
    } as ExprFunAst;

    let min = {
      exprType: ExprType.Func,
      dataType: DataType.Number,
      functionType: FunctionType.Custom,
      functionReference: "MIN",
      args: [combined[2].expr]
    } as ExprFunAst;

    let rangeSelection = {
      columnSelections: [{expr: max}, {expr: min}],
      baseRelation: selection.relation.baseRelation
    };
    const r = rt.db.exec(generateSelectionUnit(rangeSelection));
    const range = (r[0].values[0][0] as number) - (r[0].values[0][1] as number);
    let translated: ExprFunAst = {
      exprType: ExprType.Func,
      dataType: DataType.Number,
      functionType: FunctionType.Math,
      functionReference: "-",
      args: [
        combined[3].expr,
        {exprType: ExprType.Val, dataType: DataType.Number, value: r[0].values[0][1] as number}
      ]
    };
    let normalized: ExprFunAst = {
      exprType: ExprType.Func,
      dataType: DataType.Number,
      functionType: FunctionType.Math,
      functionReference: "/",
      args: [
        translated,
        {exprType: ExprType.Val, dataType: DataType.Number, value: range}
      ]
    };
    let avg: ExprFunAst = {
      exprType: ExprType.Func,
      dataType: DataType.Number,
      functionType: FunctionType.Custom,
      functionReference: "AVG",
      args: [normalized]
    };
    // select avg(column3 / range)
    query_copy.selection.compositeSelections[0].relation.columnSelections = [combined[0], combined[1], {expr: avg}];
    query_copy.selection.compositeSelections[0].relation.groupByClause = {
      selections: [combined[0].expr, combined[1].expr]
    };
    spec = {
      chartType: ChartType.Map,
      modifiedQuery: query_copy,
      xAxisColumn: (timeColumns[0].alias) ?  timeColumns[0].alias : "attribute1",
      yAxisColumn: (numericColumns[0].alias) ? numericColumns[0].alias : "attribute2"
    };
  }
  return spec;
}

function singleColumnFewDistinct(column: ColumnSelection, originalRelation: RelationReference): SelectionUnit {
  let count = {
    exprType: ExprType.Func,
    dataType: DataType.Number,
    functionType: FunctionType.Custom,
    functionReference: "COUNT",
    args: []
  } as ExprFunAst;

  let selectionUnitAst: SelectionUnit = {
      columnSelections: [
        {expr: count}, column],
      baseRelation: originalRelation,
      groupByClause: { selections: [column.expr] }
  };
  return selectionUnitAst;
}

function oneTextColumnMany(column: ColumnSelection, originalRelation: RelationReference): SelectionUnit {
  let selectionUnitAst: SelectionUnit = singleColumnFewDistinct(column, originalRelation);

  selectionUnitAst.limitClause = {
    exprType: ExprType.Val,
    dataType: DataType.Number,
    value: 10
  } as ExprValAst;

  return selectionUnitAst;
}

function oneNumericColumnMany(column: ColumnSelection, originalRelation: RelationReference, rt: DielRuntime): SelectionUnit {
  let max = {
    exprType: ExprType.Func,
    dataType: DataType.Number,
    functionType: FunctionType.Custom,
    functionReference: "MAX",
    args: [column.expr]
  } as ExprFunAst;

  let min = {
    exprType: ExprType.Func,
    dataType: DataType.Number,
    functionType: FunctionType.Custom,
    functionReference: "MIN",
    args: [column.expr]
  } as ExprFunAst;

  let rangeSelection = {
    columnSelections: [{expr: max}, {expr: min}],
    baseRelation: originalRelation,
  };
  const r = rt.db.exec(generateSelectionUnit(rangeSelection));
  let count = {
    exprType: ExprType.Func,
    dataType: DataType.Number,
    functionType: FunctionType.Custom,
    functionReference: "COUNT",
    args: []
  } as ExprFunAst;
  let sub: ExprFunAst = {
    exprType: ExprType.Func,
    dataType: DataType.Number,
    functionType: FunctionType.Math,
    functionReference: "-",
    args: [
      column.expr,
      {exprType: ExprType.Val, dataType: DataType.Number, value: r[0].values[0][1] as number}
    ]
  };
  let div: ExprFunAst = {
    exprType: ExprType.Func,
    dataType: DataType.Number,
    functionType: FunctionType.Math,
    functionReference: "/",
    args: [
      sub,
      {
        exprType: ExprType.Val,
        dataType: DataType.Number,
        value: (10.00)
      }
    ]
  };
  let round: ExprFunAst = {
    exprType: ExprType.Func,
    dataType: DataType.Number,
    functionType: FunctionType.Custom,
    functionReference: "ROUND",
    args: [div]
  };
  let mult: ExprFunAst = {
    exprType: ExprType.Func,
    dataType: DataType.Number,
    functionType: FunctionType.Math,
    functionReference: "*",
    args: [round,
      {
        exprType: ExprType.Val,
        dataType: DataType.Number,
        value: 10.0
      }]
  };
  let bin: ColumnSelection = {
    alias: "bin",
    expr: mult
  };
  let selectionUnitAst: SelectionUnit = {
    columnSelections: [{expr: count}, bin],
    baseRelation: originalRelation,
    groupByClause: {
      selections: [bin.expr]
    }
  };
  return selectionUnitAst;
}