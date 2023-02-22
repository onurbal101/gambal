import React from "react";
import Result from "../new_iowa/src/classes/Result";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Table, Button } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import {
  BsArrowRight,
  BsCheck,
  BsCheck2,
  BsCheck2Square,
  BsCheckLg,
  BsCheckSquare,
  BsPen,
  BsPencilSquare,
  BsTrash,
  BsX,
  BsXLg,
  BsXSquare,
} from "react-icons/bs";

type ResultScreenType = {
  result: Result;
};

const ResultScreen = ({ result }: ResultScreenType) => {
  const scores = result.scores;
  const scoresArr = [];
  scoresArr.push({ "1-20": scores["0.2"] });
  scoresArr.push({ "21-40": scores["0.4"] });
  scoresArr.push({ "41-60": scores["0.6"] });
  scoresArr.push({ "61-80": scores["0.8"] });
  scoresArr.push({ "81-100": scores["1"] });
  scoresArr.push({ "First Half": scores["firstHalf"] });
  scoresArr.push({ "Second Half": scores["secondHalf"] });
  scoresArr.push({ Total: scores["total"] });
  // const counts = result.counts;
  // const countsArr: any[] = [];
  // for (const key of ["A", "B", "C", "D", "AB", "CD"]) {
  //   countsArr.push({ [key]: { "1-20": counts[key]["0.2"] } });
  //   console.log(countsArr);
  //   countsArr[-1][key]["21-40"] = counts[key]["0.4"];
  //   countsArr[-1][key]["41-60"] = counts[key]["0.6"];
  //   countsArr[-1][key]["61-80"] = counts[key]["0.8"];
  //   countsArr[-1][key]["81-100"] = counts[key]["1"];
  //   countsArr[-1][key]["First Half"] = counts[key]["firstHalf"];
  //   countsArr[-1][key]["Second Half"] = counts[key]["secondHalf"];
  //   countsArr[-1][key]["Total"] = counts[key]["total"];
  // }
  // console.log(countsArr);
  return (
    <>
      <h1>Results</h1>
      <div>
        <h2>Scores</h2>
        <Table striped bordered hover responsive className="table-sm">
          <thead>
            <tr>
              <th>Segment</th>
              <th>Score</th>
              <th>Range</th>
              <th>Norm.</th>
              <th>Range</th>
              <th>A+B Count</th>
              <th>C+D Count</th>
              <th>A+B % (Quantile)</th>
              <th>C+D % (Quantile)</th>
              <th>A+B % (Total)</th>
              <th>C+D % (Total)</th>
            </tr>
          </thead>
          <tbody>
            {scoresArr.map((scorePair) =>
              Object.entries(scorePair).map((score) => (
                <tr key={"score_" + score[0]}>
                  <td>{score[0]}</td>
                  <td>{score[1]["count"]}</td>
                  <td>
                    [{score[1]["range"][0]}, {score[1]["range"][1]}]
                  </td>
                  <td>{score[1]["normalisedCount"]}</td>
                  <td>[-100, 100]</td>
                  <td>X</td>
                  <td>X</td>
                  <td>
                    {parseFloat(score[1]["quantilePercentage"]).toFixed(2)}
                  </td>
                  <td>X</td>
                  <td>
                    {parseFloat(score[1]["categoryPercentage"]).toFixed(2)}
                  </td>
                  <td>X</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </>
  );
};

export default ResultScreen;
