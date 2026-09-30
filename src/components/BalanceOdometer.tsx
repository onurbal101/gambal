import { useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { Language } from "../domain/types";
import { number } from "../i18n";

type Direction = "up" | "down";
type Roll = {
  from: string;
  to: string;
  direction: Direction;
  duration: number;
  id: number;
};

const isDigit = (value: string) => /\d/.test(value);

function digitSteps(from: number, to: number, direction: Direction) {
  return direction === "up"
    ? (to - from + 10) % 10
    : (from - to + 10) % 10;
}

export function BalanceOdometer({
  value,
  language,
}: {
  value: number;
  language: Language;
}) {
  const formatted = number(value, language);
  const previous = useRef({ value, formatted });
  const [roll, setRoll] = useState<Roll | null>(null);
  const rollId = useRef(0);

  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = { value, formatted };

    if (before.value === value) {
      setRoll(null);
      return;
    }

    const difference = Math.abs(value - before.value);
    setRoll({
      from: before.formatted,
      to: formatted,
      direction: value > before.value ? "up" : "down",
      duration: Math.max(410, 650 - Math.log10(difference) * 72),
      id: ++rollId.current,
    });
  }, [value, formatted]);

  const activeRoll = roll?.to === formatted ? roll : null;
  const previousDigits = [...(activeRoll?.from ?? formatted)]
    .filter(isDigit)
    .reverse();
  const formattedCharacters = [...formatted];
  const digitPositions = formattedCharacters
    .map((character, index) => (isDigit(character) ? index : -1))
    .filter((index) => index >= 0);
  const hasDigitMovement = digitPositions.some((index, indexFromLeft) => {
    if (!activeRoll) return false;
    const rank = digitPositions.length - indexFromLeft - 1;
    const oldCharacter = previousDigits[rank];
    const direction = activeRoll.direction;
    const oldDigit =
      oldCharacter === undefined
        ? direction === "up"
          ? 0
          : 9
        : Number(oldCharacter);
    return digitSteps(oldDigit, Number(formattedCharacters[index]), direction) > 0;
  });
  const fullTurnRank = activeRoll && !hasDigitMovement ? 0 : -1;
  let digitRank = 0;
  const parts = formattedCharacters.map((character, index) => {
    if (!isDigit(character)) {
      return <span key={`${activeRoll?.id ?? 0}-${index}`}>{character}</span>;
    }

    const indexFromLeft = digitRank++;
    const rank = digitPositions.length - indexFromLeft - 1;
    const nextDigit = Number(character);
    const oldCharacter = previousDigits[rank];
    const direction = activeRoll?.direction ?? "up";
    const oldDigit =
      oldCharacter === undefined
        ? direction === "up"
          ? 0
          : 9
        : Number(oldCharacter);
    const steps = activeRoll
      ? digitSteps(oldDigit, nextDigit, direction) ||
        (rank === fullTurnRank ? 10 : 0)
      : 0;

    if (!activeRoll || steps === 0) {
      return <span key={`${activeRoll?.id ?? 0}-${index}`}>{character}</span>;
    }

    const startRow = 20 + oldDigit;
    const endRow = startRow + (direction === "up" ? steps : -steps);
    const start = -startRow * 1.1;
    const end = -endRow * 1.1;
    const overshoot = end + (direction === "up" ? -0.14 : 0.21);
    const rebound = end + (direction === "up" ? 0.06 : -0.06);
    const style = {
      "--roll-start": `${start}em`,
      "--roll-near": `${start + (end - start) * 0.94}em`,
      "--roll-overshoot": `${overshoot}em`,
      "--roll-rebound": `${rebound}em`,
      "--roll-end": `${end}em`,
      "--roll-duration": `${activeRoll.duration}ms`,
      "--roll-delay": `${Math.min(rank, 3) * 22}ms`,
      "--roll-accent":
        direction === "up"
          ? "light-dark(#357324, #aed690)"
          : "light-dark(#bc392d, #ff998e)",
      transform: `translateY(${end}em)`,
    } as CSSProperties;
    return (
      <span className="balance-reel" key={`${activeRoll.id}-${index}`}>
        <span
          className={`balance-reel-track balance-reel-track--${direction} is-rolling`}
          style={style}
        >
          {Array.from({ length: 50 }, (_, row) => (
            <span className="balance-reel-item" key={row}>
              {row % 10}
            </span>
          ))}
        </span>
      </span>
    );
  });

  return (
    <div className="balance">
      <span className="sr">${formatted}</span>
      <span className="balance-visual" aria-hidden="true">
        <span className="balance-currency">$</span>
        {parts}
      </span>
    </div>
  );
}
