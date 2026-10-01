import type { SessionAnalysis } from "./analysis";
import type { Language } from "./types";
import { DECKS } from "./types";
import { text, percent, number, interpolate } from "../i18n";

/** Explicit descriptive rules. No norms, clinical labels, or model calls. */
export function behavioralSummary(
  data: SessionAnalysis,
  language: Language,
): string {
  const t = text(language),
    parts: string[] = [];
  if (!data.quality.behavioralDataUsable) return t.summaryUnusable;
  if (data.incomplete) parts.push(t.incompleteSession);
  const {
    firstHalfAdvantageousRate: first,
    secondHalfAdvantageousRate: second,
    learningDelta: delta,
  } = data.core;
  if (first === null || second === null || delta === null)
    parts.push(t.summaryInsufficient);
  else if (Math.abs(delta) < 1e-9)
    parts.push(
      interpolate(t.summaryStable, { first: percent(first, language) }),
    );
  else
    parts.push(
      interpolate(delta > 0 ? t.summaryIncrease : t.summaryDecrease, {
        first: percent(first, language),
        second: percent(second, language),
        delta: number(Math.abs(delta) * 100, language),
      }),
    );
  const onset = data.sequence.sustainedAdvantageousOnset;
  if (onset !== null)
    parts.push(
      interpolate(t.sustainedNote, {
        trial: onset,
        count: data.sequence.sustainedAdvantageousCount,
      }),
    );
  const late = data.core.secondHalf;
  const lateDeck = DECKS.find((deck) => late.counts[deck] > late.count / 2);
  if (lateDeck)
    parts.push(
      interpolate(t.summaryLateDeck, {
        deck: lateDeck,
        rate: percent(late.counts[lateDeck] / late.count, language),
      }),
    );
  const preference = data.choiceProfile.advantageousFrequentPreference;
  if (preference === null) parts.push(t.summaryNoAdvantage);
  else if (preference === 0.5) parts.push(t.summaryEqual);
  else
    parts.push(
      interpolate(preference > 0.5 ? t.summaryC : t.summaryD, {
        rate: percent(preference > 0.5 ? preference : 1 - preference, language),
      }),
    );
  for (const deck of ["A", "B"] as const) {
    if (data.deckCounts[deck] > data.total.count / 2)
      parts.push(
        interpolate(deck === "A" ? t.summaryA : t.summaryB, {
          rate: percent(data.deckCounts[deck] / data.total.count, language),
        }),
      );
  }
  return parts.join(" ");
}
