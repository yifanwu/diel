import * as React from "react";
import { AnnotedSelectionUnit } from "../../../code/src/runtime/runtimeTypes";
import { generateSelectionUnitBody } from "../../../code/src/compiler/codegen/codeGenSql";
import { runtime } from "../setup";
import { SelectionUnit } from "../../../code/src/parser/sqlAstTypes";

interface CodeDivProps {
  annotation: AnnotedSelectionUnit;
  setPopup: () => void;
}

/**
 * #REFACTOR: this is an opportunity to integrate with the string generation
 * @param p annotations
 */
export const CodeDiv: React.StatelessComponent<CodeDivProps> = (p) => {
  const ast = p.annotation.ast;
  // this function should return the value (with some memorization?)
  function generateClickHandler(ast: SelectionUnit) {
    return () => {
      runtime.ExecuteAstQuery(ast);
    };
  }
  const selections = ast.derivedColumnSelections.map((s, i) => {
    return <span onClick={generateClickHandler(p.annotation.columnSelections[i].ast)}></span>;
  });
  // demo purpose
  // need to change to spans and add other things
  const body = <p>{generateSelectionUnitBody(ast)}</p>;
  // const body = p.annotation.ast.
  return <div className="code-annotated">
    {selections}
    {body}
  </div>;
};