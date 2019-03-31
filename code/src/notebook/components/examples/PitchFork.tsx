import * as React from "react";

import { ChartType } from "../../../runtime/runtimeTypes";
import DielComponent from "../diel/DielComponent";
import { diel } from "../../setup";

enum ComponentRelations {
  currentUserGenreSelection = "currentUserGenreSelection",
  pitchForkScoreDistribution = "pitchForkScoreDistribution",
  pitchForkYearDistribution = "pitchForkYearDistribution",
  allGenres = "allGenres"
}

export default class PitchFork extends DielComponent<{}> {
  constructor(props: {}) {
    super(props);
    this.state = {};
    super.BindDielOutputs(Object.keys(ComponentRelations));
  }
  render() {
    const scoreChart = this.GenerateChart(ChartType.BarChart, ComponentRelations.pitchForkScoreDistribution);
    const yearChart = this.GenerateChart(ChartType.BarChart, ComponentRelations.pitchForkYearDistribution);
    const explaination = <div><p>
        In this chart, selecting the genre would filter the two charts.
        Further selecting on the charts would filter the other.
      </p></div>;

    const options = this.state[ComponentRelations.allGenres]
      ? this.state[ComponentRelations.allGenres]
            .map((i) => <a
              className="selection-options"
              onClick={() => diel.NewInput("userGenreSelectionEvent", {genre: i.genre})}>{i.genre}
            </a>)
      : <p>loading...</p>;

    const curGenre = this.state[ComponentRelations.currentUserGenreSelection];
    const vis = (curGenre)
      ? <>
        <p>{curGenre} Score Distribution</p>
          {scoreChart}
        <p>{curGenre} Year Distribution</p>
          {yearChart}
      </>
      : <p>Please select a genre to get started</p>;

   return <>
      <h2>This is a demo of Pitchfork review data</h2>
      <div className="top-nave">
        {options}
      </div>
      {vis}
      {explaination}
    </>;
  }
}