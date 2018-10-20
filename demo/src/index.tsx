import * as React from "react";
import * as ReactDOM from "react-dom";

import { PageContainer } from "./components/PageContainer";

// this is the place where DIEL should be loaded with the
// generated .db file
export function loadPage() {
  ReactDOM.render(
    <PageContainer/>,
    document.getElementById("wrapper")
  );
}