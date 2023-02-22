import React, { useState } from "react";
import { Button } from "react-bootstrap";

type DeckProps = {
  name: string;
  clickHandler: any;
  disabled: any;
};

const Deck = ({ name, clickHandler, disabled }: DeckProps) => {
  return (
    <Button disabled={disabled} onClick={clickHandler}>
      {name}
    </Button>
  );
};

export default Deck;
