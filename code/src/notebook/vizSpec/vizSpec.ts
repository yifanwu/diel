import { DerivedRelation, DataType, CompositeSelectionUnit, SelectionUnit, ColumnSelection, SetOperator } from "../../parser/dielAstTypes";
import DielRuntime from "../../runtime/DielRuntime";
import { ChartType, RelationObject } from "../../runtime/runtimeTypes";
import { ExprType, ExprFunAst, FunctionType } from "../../parser/exprAstTypes";
import { generateSelectionUnit, generateSqlViews } from "../../compiler/codegen/codeGenSql";
import { RelationQuery, SqlRelationType } from "../../compiler/codegen/createSqlIr";
import * as d3ScaleChromatic from "d3-scale-chromatic";

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

// handles simple queries only
export function generateVizSpecForSingleQuery(rt: DielRuntime, q: DerivedRelation): VizSpec {
  let selection: CompositeSelectionUnit = q.selection.compositeSelections[0] //TODO: multiple composite selections
  let columnSelections: ColumnSelection[] = selection.relation.columnSelections //
  
  let spec : VizSpec = null
  let query_copy = JSON.parse(JSON.stringify(q));
  let timeColumns: ColumnSelection[] = []
  let numericColumns: ColumnSelection[] = []
  let uselessColumns: ColumnSelection[] = []
  
  for (let c of columnSelections) {
    if (c.expr.dataType == DataType.TimeStamp) {
      timeColumns.push(c);
    } else if (c.expr.dataType == DataType.Number) {
      numericColumns.push(c);
    } else {
      uselessColumns.push(c);
    } 
  }
  if (timeColumns.length + numericColumns.length == 0) {
    return spec
  } else if (timeColumns.length + numericColumns.length == 1) {
    
    var combined = timeColumns.concat(numericColumns);
    var columnName = (combined[0].alias) ? combined[0].alias : "column";
    combined[0].alias = columnName;
    let count = {
      functionType: FunctionType.Custom,
      functionReference: "COUNT",
      args: []
    } as ExprFunAst;
    var uniqueValues : SelectionUnit = {
      columnSelections: [{expr: count}],
      baseRelation: {relationName: q.name},
      groupByClause: {
        selections: [combined[0].expr]
      }
    };    
    const r = rt.db.exec(generateSelectionUnit(uniqueValues));
    var n = r.values.length;
    if (n > 10) {
      let c = combined[0];
      let count = {
        functionType: FunctionType.BuiltIn,
        functionReference: "COUNT",
        args: []
      } as ExprFunAst;
      let max = {
        functionType: FunctionType.BuiltIn,
        functionReference: "MAX",
        args: [c.expr]
      } as ExprFunAst;
      let min = {
        functionType: FunctionType.BuiltIn,
        functionReference: "MIN",
        args: [c.expr]
      } as ExprFunAst;
  
      let argstats: RelationQuery = {
        name: "argstats",
        sqlRelationType: SqlRelationType.View,
        query: [
          {
            op: SetOperator.NA,
            relation:{
              columnSelections: [{expr: max, alias: "max"}, {expr: min, alias: "min"}],
              baseRelation: {relationName: q.name},
            }
          }
        ],
      };
      rt.db.exec(generateSqlViews(argstats));
      rt.db.exec(`create view bins as select round(10 * ${columnName} / (argstats.max - argstats.min)) as bin, ${columnName} from ${q.name}`)
      query_copy.allDerivedSelections[0] = {
        columnSelections: [
          {expr: count}, {expr: "bin"}],
        baseRelation: {relationName: "bins"},
        groupByClause: { selections: [{exprType: ExprType.Column, dataType: DataType.Number, columnName: "bin", hasStar: false}]
        }
      }
      spec = {
        chartType: ChartType.BarChart,
        modifiedQuery: query_copy,
        xAxisColumn: columnName,
        yAxisColumn: "quantity" 
      }
    } else {
      query_copy.allDerivedSelections[0] = {
        columnSelections: [
          {expr: count}, combined[0]],
        baseRelation: {relationName: q.name},
        groupByClause: { selections: [combined[0].expr] }
      };
      spec = {
        chartType: ChartType.BarChart,
        modifiedQuery: query_copy,
        xAxisColumn: columnName,
        yAxisColumn: "quantity"
      }
    }
  } else if (timeColumns.length + numericColumns.length == 2)
   {
    if (!(timeColumns.length==0)) {
      query_copy.allDerivedSelections[0].columnSelections = [timeColumns[0], numericColumns[0]];
      spec = {
        chartType: ChartType.LineChart,
        modifiedQuery: query_copy,
        xAxisColumn: (timeColumns[0].alias) ?  timeColumns[0].alias : "time",
        yAxisColumn: (numericColumns[0].alias) ? numericColumns[0].alias : "attribute"
      }
    } else {
      query_copy.allDerivedSelections[0].columnSelections = [numericColumns[0], numericColumns[1]];
      spec = {
        chartType: ChartType.Scatter,
        modifiedQuery: query_copy,
        xAxisColumn: (timeColumns[0].alias) ?  timeColumns[0].alias : "attribute1",
        yAxisColumn: (numericColumns[0].alias) ? numericColumns[0].alias : "attribute2"
      }
    }
  }
  // const r = rt.db.exec(`select count() from totalWorkerClickEvents`);
  // console.log("%c TESTING", "color: red");
  return spec;
}