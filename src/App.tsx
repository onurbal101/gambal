import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Container } from "react-bootstrap";

import Header from "./components/Header";
import Footer from "./components/Footer";

import HomeScreen from "./screens/HomeScreen";
import EvaluatorScreen from "./screens/EvaluatorScreen";
import PlayerScreen from "./screens/PlayerScreen";
import CustomisationScreen from "./screens/CustomisationScreen";
import InstructionScreen from "./screens/InstructionScreen";
import GameScreen from "./screens/GameScreen";
import ResultScreen from "./screens/ResultScreen";
import Game from "./new_iowa/src/index";

const App = () => {
  const game: Game = new Game();
  return (
    <Router basename="/gambal">
      <Header />
      <main className="py-3">
        <Container>
          <Routes>
            <Route path="/" element={<HomeScreen player={game.player} />} />
            <Route
              path="/evaluator"
              element={<EvaluatorScreen evaluator={game.evaluator} />}
            />
            <Route
              path="/player"
              element={<PlayerScreen player={game.player} />}
            />
            <Route path="/customisation" element={<CustomisationScreen />} />
            <Route path="/instructions" element={<InstructionScreen />} />
            <Route
              path="/game"
              element={
                <GameScreen
                  player={game.player}
                  deckA={game.deckA}
                  deckB={game.deckB}
                  deckC={game.deckC}
                  deckD={game.deckD}
                  game={game}
                />
              }
            />
            <Route
              path="/results"
              element={<ResultScreen result={game.result} />}
            />
          </Routes>
        </Container>
      </main>
      <Footer />
    </Router>
  );
};

export default App;
