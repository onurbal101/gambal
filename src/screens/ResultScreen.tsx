import React from "react";
import Result from "../new_iowa/src/classes/Result";

type ResultScreenType = {
  result: Result;
};

const ResultScreen = ({ result }: ResultScreenType) => {
  console.log(result.scores);
  return (
    <>
      <div>
        <h2>Scores</h2>
        <p>1-20: {JSON.stringify(result.scores["0.2"])}</p>
        <p>21-40: {JSON.stringify(result.scores["0.4"])}</p>
        <p>41-60: {JSON.stringify(result.scores["0.6"])}</p>
        <p>61-80: {JSON.stringify(result.scores["0.8"])}</p>
        <p>81-100: {JSON.stringify(result.scores["1"])}</p>
      </div>
      <div>
        <h2>Counts</h2>
        <h3>A: </h3>
        <p>1-20: {JSON.stringify(result.counts["A"]["0.2"])}</p>
        <p>21-40: {JSON.stringify(result.counts["A"]["0.4"])}</p>
        <p>41-60: {JSON.stringify(result.counts["A"]["0.6"])}</p>
        <p>61-80: {JSON.stringify(result.counts["A"]["0.8"])}</p>
        <p>81-100: {JSON.stringify(result.counts["A"]["1"])}</p>
        <hr />
        <h3>B: </h3>
        <p>1-20: {JSON.stringify(result.counts["B"]["0.2"])}</p>
        <p>21-40: {JSON.stringify(result.counts["B"]["0.4"])}</p>
        <p>41-60: {JSON.stringify(result.counts["B"]["0.6"])}</p>
        <p>61-80: {JSON.stringify(result.counts["B"]["0.8"])}</p>
        <p>81-100: {JSON.stringify(result.counts["B"]["1"])}</p>
        <hr />
        <h3>C: </h3>
        <p>1-20: {JSON.stringify(result.counts["C"]["0.2"])}</p>
        <p>21-40: {JSON.stringify(result.counts["C"]["0.4"])}</p>
        <p>41-60: {JSON.stringify(result.counts["C"]["0.6"])}</p>
        <p>61-80: {JSON.stringify(result.counts["C"]["0.8"])}</p>
        <p>81-100: {JSON.stringify(result.counts["C"]["1"])}</p>
        <hr />
        <h3>D: </h3>
        <p>1-20: {JSON.stringify(result.counts["D"]["0.2"])}</p>
        <p>21-40: {JSON.stringify(result.counts["D"]["0.4"])}</p>
        <p>41-60: {JSON.stringify(result.counts["D"]["0.6"])}</p>
        <p>61-80: {JSON.stringify(result.counts["D"]["0.8"])}</p>
        <p>81-100: {JSON.stringify(result.counts["D"]["1"])}</p>
        <hr />
      </div>
    </>
  );
};

export default ResultScreen;
