import * as React from "react";
import { AnnotedSelectionUnit, AnnotationSpec } from "../../runtime/runtimeTypes";
import { generateSelectionUnitBody } from "../../compiler/codegen/codeGenSql";

interface CodeDivProps {
  annotation: AnnotedSelectionUnit;
  // setPopup: (ast: AnnotationSpec, xPos: number, yPos: number) => void;
}

/**
 * #REFACTOR: this is an opportunity to integrate with the string generation
 * @param p annotations
 */
export const CodeDiv: React.StatelessComponent<CodeDivProps> = (p) => {
  const ast = p.annotation.ast;
  // this function should return the value (with some memorization?)
  function generateClickHandler(spec: AnnotationSpec) {
    return () => {
      // need to find the xPos and yPos
      const elem = document.getElementById(spec.semanticId);
      const pos = elem.getBoundingClientRect();
      // p.setPopup(spec, pos.left, pos.top);
    };
  }
  const selections = ast.derivedColumnSelections.map((_, i) => {
    const a = p.annotation.columnSelections[i];
    return <span id={a.semanticId} onClick={generateClickHandler(a)}></span>;
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