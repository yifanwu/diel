import { RelationType, SetOperator, JoinAst, ExprAst, ExprFunAst, FunctionType, AstType,  ExprType, DielDataType, JoinType, CompositeSelectionUnit, RelationSelection, DerivedRelation, SelectionUnit, ExprColumnAst, RelationReferenceType } from "../parser/dielAstTypes";
import { ApplyLatestToDerivedRelation } from "../compiler/passes/syntaxSugar";
import { LogInternalError } from "../util/messages";
import { BuiltInColumn } from "../compiler/DielAstGetters";

function getTimestepColumn(relationName: string, request = false): ExprColumnAst {
  return {
    exprType: ExprType.Column,
    dataType: DielDataType.Number,
    columnName: request ? BuiltInColumn.REQUEST_TIMESTEP : BuiltInColumn.TIMESTEP,
    relationName
  };
}

function defaultPolicyGetOutputHelper(ast: DerivedRelation, asyncViewName: string, eventDeps: Set<string>): DerivedRelation {
  const derivedColumnSelections = ast.selection.compositeSelections[0].relation.derivedColumnSelections;
  if (!derivedColumnSelections) {
    LogInternalError(`AST for ${ast.rName} should be compiled`);
  }
  if (eventDeps.size === 0) {
    const newOutput: DerivedRelation = {
      rName: ast.rName,
      relationType: RelationType.Output,
      selection: {
        astType: AstType.RelationSelection,
        compositeSelections: [{
          op: SetOperator.NA,
          relation: {
            isDistinct: false,
            columnSelections: [], // placeholder
            derivedColumnSelections,
            baseRelation: {
              relationReferenceType: RelationReferenceType.Direct,
              isLatest: true,
              relationName: asyncViewName
            }
          }
        }]
      }
    };
    return ApplyLatestToDerivedRelation(newOutput);
  } else {
    let timeStepSelections: SelectionUnit[] = [];
    eventDeps.forEach(e => {
      timeStepSelections.push({
        isDistinct: false,
        derivedColumnSelections: [{
          expr: getTimestepColumn(e),
          alias:  BuiltInColumn.TIMESTEP,
        }],
        baseRelation: {
          relationReferenceType: RelationReferenceType.Direct,
          relationName: e,
        }
      });
    });
    const unionedTimestepRelationName = "timestepUnion";
    const compositeSelections = timeStepSelections.map((relation, i) => {
      if (i) {
        return {
          op: SetOperator.UNION,
          relation
        };
      } else {
        return {
          op: SetOperator.NA,
          relation
        };
      }
    });
    const unionTimestepRelation: RelationSelection = {
      astType: AstType.RelationSelection,
      compositeSelections
    };
    const maxTimeStepRelationName = "maxTimeStep";
    const maxColumnSelection: RelationSelection = {
      astType: AstType.RelationSelection,
      compositeSelections: [{
        op: SetOperator.NA,
        relation: {
          derivedColumnSelections: [{
            expr: {
              exprType: ExprType.Column,
              dataType: DielDataType.Number,
              functionType: FunctionType.Math,
              functionReference: "max",
              args: [getTimestepColumn(unionedTimestepRelationName)]
            },
            alias: BuiltInColumn.TIMESTEP
          }],
          baseRelation: {
            relationReferenceType: RelationReferenceType.Subquery,
            subquery: unionTimestepRelation,
            alias: unionedTimestepRelationName
          }
        }
      }]
    };
    let joinClauses: JoinAst[] = [{
      astType: AstType.Join,
      joinType: JoinType.Inner,
      relation: {
        relationReferenceType: RelationReferenceType.Subquery,
        subquery: maxColumnSelection,
        alias: maxTimeStepRelationName
      },
      predicate: {
        exprType: ExprType.Func,
        dataType: DielDataType.Boolean,
        functionType: FunctionType.Compare,
        functionReference: "=",
        args: [getTimestepColumn(asyncViewName, true), getTimestepColumn(maxTimeStepRelationName)]
      }
    }];
    const newOutput: DerivedRelation = {
      rName: ast.rName,
      relationType: RelationType.Output,
      selection: {
        astType: AstType.RelationSelection,
        compositeSelections: [{
          op: SetOperator.NA,
          relation: {
            derivedColumnSelections,
            baseRelation: {
              relationReferenceType: RelationReferenceType.Direct,
              relationName: asyncViewName
            },
            joinClauses
          }
        }]
      }
    };
    return newOutput;
  }
}

/**
 * Note that we are passing the input dependencies here because
 * otherwise it needs to get access to the IR/depTree
 * an example would be
  SELECT *
  FROM distDataEvent e
    JOIN LATEST slideItx i ON i.timestep = e.request_timestep;

    where request_timestep = (select max timestep from slideItx union )
  we need to find the latest of all the inputs, if there are more than one
 * @param ast
 * @param inputDeps
 */
export function OutputToAsyncDefaultPolicty(ast: DerivedRelation, eventDeps: Set<string>) {
  // first create a new async view from the output
  // again, copy by reference, should be a bit careful here
  const viewName = `${ast.rName}AsyncView`;
  const asyncView: DerivedRelation = {
    rName: viewName,
    relationType: RelationType.EventView,
    selection: ast.selection
  };
  const output = defaultPolicyGetOutputHelper(ast, viewName, eventDeps);
  return {
    asyncView,
    output
  };
}