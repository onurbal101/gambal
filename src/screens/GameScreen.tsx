import React, { useState } from "react";

import Deck from "../components/Deck";
import Card from "../new_iowa/src/classes/Card";

const GameScreen = ({ player, deckA, deckB, deckC, deckD, game }: any) => {
  const [card, setCard] = useState<Card>();
  const makeChoice = (deck: any) => {
    if (deck.isEmpty) return;

    const card: Card = player.choose(deck);
    setCard(card);
  };

  return (
    <div id="game">
      <div id="player-info">
        <div id="money">
          <p>Balance: ${player.balance}</p>
        </div>
        <div id="pnl-chart" />
      </div>
      {card !== undefined ? (
        <div id="result-box">
          <p>Profit: ${card.profit}</p>
          <p>Loss: ${card.loss}</p>
        </div>
      ) : (
        ""
      )}
      <div hidden={!game.isInProgress} id="decks">
        <Deck
          disabled={deckA.isEmpty}
          name="A"
          clickHandler={(e: any) => makeChoice(deckA)}
        />
        <Deck
          disabled={deckB.isEmpty}
          name="B"
          clickHandler={(e: any) => makeChoice(deckB)}
        />
        <Deck
          disabled={deckC.isEmpty}
          name="C"
          clickHandler={(e: any) => makeChoice(deckC)}
        />
        <Deck
          disabled={deckD.isEmpty}
          name="D"
          clickHandler={(e: any) => makeChoice(deckD)}
        />
      </div>
    </div>
  );
};

export default GameScreen;
