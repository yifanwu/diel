import * as React from "react";
import * as ReactDOM from "react-dom";

import { PageContainer } from "./components/PageContainer";

console.log("setting up load page");

ReactDOM.render(
  <>
    <h2>Welcome to DIEL!</h2>
    <p>Please wait, we are loading data files into Web Workers and it may take a while.</p>
  </>,
  document.getElementById("wrapper")
);


// this is the place where DIEL should be loaded with the
// generated .db file
export function loadPage() {
  ReactDOM.render(
    <PageContainer/>,
    document.getElementById("wrapper")
  );
}