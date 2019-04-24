import { GetAllDerivedViews, IsRelationEvent, GetRelationDef } from "../DielAstGetters";
import { DependencyTree, NodeDependency } from "../../runtime/runtimeTypes";
import { SqlDerivedRelation } from "../../parser/sqlAstTypes";
import { LogInternalError } from "../../util/messages";
import { RelationNameType, DielAst, RelationType, CompositeSelection, SelectionUnit, RelationReference, ExprAst, ExprType, ExprRelationAst, ExprFunAst, ExprParen, RelationReferenceType, RelationReferenceDirect, RelationReferenceSubquery, DerivedRelation, Relation } from "../../parser/dielAstTypes";
import { getTopologicalOrder } from "./passesHelper";
import { SetSymmetricDifference } from "../../util/dielUtils";


export function ArrangeInTopologicalOrder(ast: DielAst): void {
  if (!ast.depTree) return LogInternalError(`the dependency should be defined already!`);
  const orderedNames = getTopologicalOrder(ast.depTree);
  // TMP
  const newRelations: Relation[] = [];
  orderedNames.map(n => {
    const def = GetRelationDef(ast, n);
    if (def) newRelations.push(def);
  });
  function checkDiff() {
    const topo = new Set(newRelations.map(n => n.rName));
    const relation = new Set(ast.relations.map(r => r.rName));
    const diff = SetSymmetricDifference(topo, relation);
    if (diff.size > 0) LogInternalError(`Topological sort length did not match, ${diff}`);
  }

  // there are cases when relations that are not read by anyone is just not inserted, i.e. no deps etc.
  if (newRelations.length > ast.relations.length) {
    checkDiff;
  } else if (newRelations.length === ast.relations.length) {
    ast.relations = newRelations;
    return;
  } else {
    const diff = SetSymmetricDifference(new Set(newRelations.map(n => n.rName)), new Set(ast.relations.map(r => r.rName)));
    diff.forEach(d => {
      const def = GetRelationDef(ast, d);
      if (def) newRelations.push(def);
    });
    checkDiff;
    ast.relations = newRelations;
  }
}
/**
 * return the set of the relations that depent on the table passed in
 * TODO add depndsOn?: true and do another pass that uses transitive closure to figure out all dependnecies
 * @param depTree
 * @param rName
 * @param depndsOn the boolean is defaulted to true, if it's false, it's the other direction.
 */
export function DeriveDependentRelations(depTree: DependencyTree, rName: RelationNameType): Set<string> {
  const allDependencies = new Set<string>();
  oneStep(rName, allDependencies);
  // recursively checks for dependencies
  function oneStep(rName: string, newDependencies: Set<string>) {
    // search through dependency
    let oldSet = new Set(newDependencies);
    for (let [key, value] of depTree) {
      const found = value.dependsOn.filter(d => d === rName);
      if (found.length > 0) {
        newDependencies.add(key);
      }
    }
    // set difference
    const diff = new Set([...newDependencies].filter(x => !oldSet.has(x)));
    if (diff.size > 0) {
      // need to run this on more dependencies
      diff.forEach((v) => {
        oneStep(v, newDependencies);
      });
    }
    return newDependencies;
  }
  return allDependencies;
}

export function DeriveDepTreeFromSqlRelations(views: SqlDerivedRelation[], dynamic: Set<RelationNameType>): DependencyTree {
  const depTree: DependencyTree = new Map<RelationNameType, NodeDependency>();
  const isDynamic = (rName: RelationNameType) => {
    return dynamic.has(rName);
  };
  views.map(v => AddSingleDependency(depTree, v.selection, v.rName, isDynamic));
  return depTree;
}

/**
 * Get the set of relations that the view depends on
 * needs to iterate until we hit the original tables
 * @param viewName
 * @param depTree
 */
export function DeriveOriginalRelationsAViewDependsOn(depTree: DependencyTree, viewName: string): Set<string> | null {

  let dep = depTree.get(viewName);
  let tables = new Set<string> ();
  if (dep && dep.dependsOn.length > 0) {
    // breadth first
    let toVisit = dep.dependsOn.slice();
    let visited = [viewName] as string[];

    let next: string | undefined;
     while (toVisit.length > 0) {
       next = toVisit.shift();
      if (next) {
        const dep = depTree.get(next);
        if (!dep) {
          return LogInternalError(`Dependency ${dep} not found`);
        }
        if (dep.isDynamic) {
          tables.add(next);
          visited.push(next);
          if (dep.dependsOn.length !== 0) {
            LogInternalError(`dynamic tables should have zero dependencies!`);
          }
          continue;
        } else {
          let children = dep.dependsOn;
          children.forEach(child => {
            if (toVisit.indexOf(next) === -1 && visited.indexOf(next) === -1) {
              toVisit.push(child);
            }
          });
          visited.push(next);
        }
      }
    }
  }
  return tables;
}


// ------------- BEGIN SETTER --------------------
export function AddDepTree(ast: DielAst): DependencyTree {
  const isDynamic = (rName: string) => {
    const found = ast.relations.find(r => r.rName === rName);
    return (found && found.relationType === RelationType.EventTable) ? true : false;
  };
  GetAllDerivedViews(ast).map(v => AddSingleDependency(ast.depTree, v.selection.compositeSelections, v.rName, isDynamic));

  return ast.depTree;
}

export function AddSingleDependencyByDerivedRelation(ast: DielAst, view: DerivedRelation) {
  const isDynamic = (rName: string) => {
    return IsRelationEvent(ast, rName);
  };
  AddSingleDependency(ast.depTree, view.selection.compositeSelections, view.rName, isDynamic);
}

// CompositeSelection |CompositeSelectionFinal
// the relation is dynamic if it's an event view
export function AddSingleDependency (
  depTree: DependencyTree,
  selection: CompositeSelection,
  rName: string,
  isDynamic: (rName: string) => boolean
  ) {
  // first add dependency one way, then the other way
  const dependsOn = addDependencyOneWay(depTree, selection, rName, isDynamic);
  addDependencyOtherWay(depTree, dependsOn, rName, isDynamic);
}

// CompositeSelection |CompositeSelectionFinal
// incremental dep tree building
function addDependencyOneWay(depTree: DependencyTree, selection: CompositeSelection, rName: string,
  isDynamic: (rName: string) => boolean
) {
  let dependsOn: string[] = [];
  selection.map(c => {
    const deps = getSelectionUnitDep(c.relation);
    dependsOn = deps.concat(dependsOn);
  });
  depTree.set(rName, {
    relationName: rName,
    isDynamic: isDynamic(rName),
    dependsOn,
    isDependedBy: []
  });
  return dependsOn;
}

// recursive!
// SelectionUnit | SelectionUnitFinal
function getSelectionUnitDep(s: SelectionUnit): string[] {
  if (!s.baseRelation) {
    return [];
  }
  const depsRaw = getRelationReferenceDep(s.baseRelation);
  let deps = depsRaw ? depsRaw : [];
  // the predicates on joins might have dependencies too... #FIXMELATER
  if (s.joinClauses) s.joinClauses.map(j => {
    const joinDepsRaw = getRelationReferenceDep(j.relation);
    if (joinDepsRaw) deps = deps.concat(joinDepsRaw);
  });
  if (s.whereClause) {
    getExprDep(deps, s.whereClause);
  }
  return deps;
}

function getRelationReferenceDep(ref: RelationReference): string[] | null {
  switch (ref.relationReferenceType) {
    case RelationReferenceType.Direct: {
      const r = ref as RelationReferenceDirect;
      return [r.relationName];
    }
    case RelationReferenceType.Subquery: {
      const r = ref as RelationReferenceSubquery;
      const acc: string[] = [];
      r.subquery.compositeSelections.map(c => acc.concat(getSelectionUnitDep(c.relation)), []);
      return acc;
    }
  }
}

function getExprDep(depAcc: string[], e: ExprAst): void {
  if (!e) {
    debugger;
  }
  switch (e.exprType) {
    case ExprType.Relation:
      const relationExpr = e as ExprRelationAst;
      relationExpr.selection.compositeSelections.map(newE => {
        depAcc.push(...getSelectionUnitDep(newE.relation));
      });
      break;
    case ExprType.Func:
      const whereFuncExpr = (e as ExprFunAst);
      whereFuncExpr.args.map(newE => {
        getExprDep(depAcc, newE);
      });
      break;
    case ExprType.Parenthesis:
      getExprDep(depAcc, (e as ExprParen).content);
      break;
    default:
      return;
      // do nothing for now
  }
}

function addDependencyOtherWay(depTree: DependencyTree,
dependsOn: RelationNameType[],
viewName: RelationNameType,
isDynamic: (rName: string) => boolean
) {
dependsOn.map(dO => {
  if (dO) {
    // avoid the case when its null
    // it's possible that these don't exist, if they are the leaves
    const dep = depTree.get(dO);
    if (!dep) {
      depTree.set(dO, {
        relationName: dO,
        dependsOn: [],
        isDependedBy: [viewName],
        isDynamic: isDynamic(dO),
      });
    } else {
      dep.isDependedBy.push(viewName);
    }
  }
});
}

