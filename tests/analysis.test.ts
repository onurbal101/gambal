import { describe, expect, it } from "vitest";
import fixture from "./fixtures/g-a866be62.json";
import {
  analyzeSession,
  analyzeFeedback,
  analyzeSequence,
  quantile,
  ratio,
  validateSession,
  FAST_RESPONSE_THRESHOLD_MS,
} from "../src/domain/analysis";
import { behavioralSummary } from "../src/domain/summary";
import { DECKS, emptyPositions } from "../src/domain/types";
import type { DeckId, SessionRecord } from "../src/domain/types";

const sample = () => structuredClone(fixture) as SessionRecord;
/** A synthetic task with long decks permits all-A/B/C/D histories without exhaustion. */
function synthetic(
  decks: DeckId[],
  expected = 100,
  stages = 1,
  reset = true,
): SessionRecord {
  const record = sample(),
    s = record.session;
  s.task.procedure = {
    ...s.task.procedure,
    trialsPerStage: expected / stages,
    stages,
    resetBetweenStages: reset,
  };
  s.task.decks = Object.fromEntries(
    DECKS.map((d) => [
      d,
      Array.from({ length: expected }, () => ({ gain: 50, loss: 0 })),
    ]),
  ) as typeof s.task.decks;
  let positions = emptyPositions(),
    balance = 2000,
    previousStage = 1;
  record.trials = decks.map((deck, i) => {
    const stage = Math.floor(i / s.task.procedure.trialsPerStage) + 1;
    if (stage !== previousStage && reset) {
      positions = emptyPositions();
      balance = 2000;
    }
    previousStage = stage;
    positions[deck]++;
    balance += 50;
    return {
      ...fixture.trials[0],
      id: `trial-${i}`,
      sessionId: s.id,
      sequence: i + 1,
      stage,
      stageSequence: (i % s.task.procedure.trialsPerStage) + 1,
      deck,
      deckPosition: positions[deck],
      gain: 50,
      loss: 0,
      balance,
      responseTimeMs: 200 + i,
      afterInterruption: false,
    };
  });
  Object.assign(s, {
    positions,
    balance,
    trialCount: decks.length,
    stage: previousStage,
    stageTrialCount: decks.length
      ? ((decks.length - 1) % s.task.procedure.trialsPerStage) + 1
      : 0,
    status: decks.length === expected ? "completed" : "stopped",
  });
  record.interruptions = [];
  return record;
}

describe("source session regression", () => {
  it("reproduces all requested metrics and experienced outcomes without mutating input", () => {
    const record = sample(),
      before = structuredClone(record),
      a = analyzeSession(record);
    expect(a.deckCounts).toEqual({ A: 10, B: 14, C: 56, D: 20 });
    expect(a.core.netScore).toBe(52);
    expect(a.core.advantageousChoiceRate).toBe(0.76);
    expect(a.core.disadvantageousChoiceRate).toBe(0.24);
    expect(a.core.firstHalfAdvantageousRate).toBe(0.6);
    expect(a.core.secondHalfAdvantageousRate).toBe(0.92);
    expect(a.core.learningDelta).toBeCloseTo(0.32);
    expect(a.choiceProfile.disadvantageousFrequentPreference).toBeCloseTo(
      10 / 24,
    );
    expect(a.choiceProfile.advantageousFrequentPreference).toBeCloseTo(56 / 76);
    expect(a.choiceProfile.overallFrequentPreference).toBe(0.66);
    expect(a.choiceProfile.frequencyContextShift).toBeCloseTo(
      56 / 76 - 10 / 24,
    );
    expect(a.stages[0].blocks.map((b) => b.score)).toEqual([0, 8, 4, 20, 20]);
    expect(a.stages[0].blocks.map((b) => b.counts)).toEqual([
      { A: 4, B: 6, C: 6, D: 4 },
      { A: 3, B: 3, C: 9, D: 5 },
      { A: 3, B: 5, C: 8, D: 4 },
      { A: 0, B: 0, C: 15, D: 5 },
      { A: 0, B: 0, C: 18, D: 2 },
    ]);
    expect(a.finalBalance).toBe(2755);
    const expected = {
      A: [10, 1000, 1250, -250, 5, 350],
      B: [14, 1430, 2750, -1320, 2, 1500],
      C: [56, 3450, 1650, 1800, 41, 75],
      D: [20, 1050, 525, 525, 2, 275],
    };
    for (const d of DECKS) {
      const row = a.deckOutcomes[d],
        [
          choices,
          grossGain,
          losses,
          netOutcome,
          punishmentEvents,
          largestPunishment,
        ] = expected[d];
      expect(row).toMatchObject({
        choices,
        grossGain,
        losses,
        netOutcome,
        punishmentEvents,
        largestPunishment,
      });
      expect(row.averageNetOutcome).toBeCloseTo(netOutcome / choices);
      expect(row.punishmentEventRate).toBeCloseTo(punishmentEvents / choices);
    }
    expect(a.sequence.sustainedAdvantageousOnset).toBe(55);
    expect(a.sequence.longestAdvantageousRun).toBe(46);
    expect(a.sequence.sustainedAdvantageousCount).toBe(46);
    expect(a.quality.warnings).toEqual([]);
    expect(a.quality.balanceReconciles).toBe(true);
    expect(a.quality.positionsReconcile).toBe(true);
    expect(
      a.feedback.salientPunishmentEvents
        .filter((e) => e.deck === "B")
        .map((e) => e.loss),
    ).toEqual([1250, 1500]);
    expect(record).toEqual(before);
    expect(JSON.stringify(a)).not.toMatch(/NaN|Infinity/);
  });
});

describe("rates, halves, blocks, and sequences", () => {
  it.each(DECKS)("handles all %s and zero pair denominators", (deck) => {
    const a = analyzeSession(synthetic(Array(100).fill(deck)));
    expect(a.core.netScore).toBe(deck === "A" || deck === "B" ? -100 : 100);
    expect(a.core.learningDelta).toBe(0);
    expect(a.choiceProfile.advantageousFrequentPreference).toBe(
      deck === "A" || deck === "B" ? null : deck === "C" ? 1 : 0,
    );
    expect(a.choiceProfile.disadvantageousFrequentPreference).toBe(
      deck === "C" || deck === "D" ? null : deck === "A" ? 1 : 0,
    );
    expect(a.sequence.longestSingleDeckRun).toBe(100);
    expect(a.sequence.sustainedAdvantageousOnset).toBe(
      deck === "C" || deck === "D" ? 1 : null,
    );
    expect(
      a.deckOutcomes[DECKS.find((d) => d !== deck)!].averageNetOutcome,
    ).toBeNull();
    expect(a.feedback.punishmentSwitchRate).toBeNull();
  });
  it("handles equal decks", () => {
    const a = analyzeSession(
      synthetic(Array.from({ length: 100 }, (_, i) => DECKS[i % 4])),
    );
    expect(a.core.netScore).toBe(0);
    expect(a.core.advantageousChoiceRate).toBe(0.5);
    expect(a.choiceProfile).toEqual({
      advantageousFrequentPreference: 0.5,
      disadvantageousFrequentPreference: 0.5,
      overallFrequentPreference: 0.5,
      frequencyContextShift: 0,
    });
  });
  it("keeps fixed planned halves and partial blocks for incomplete sessions", () => {
    const a = analyzeSession(synthetic(Array(23).fill("C")));
    expect(a.core.firstHalf.count).toBe(23);
    expect(a.core.secondHalf.count).toBe(0);
    expect(a.core.learningDelta).toBeNull();
    expect(a.stages[0].blocks.map((b) => b.count)).toEqual([20, 3, 0, 0, 0]);
    expect(a.sequence.sustainedAdvantageousOnset).toBeNull();
    expect(a.quality.trialCountValid).toBe(false);
    expect(a.quality.unobservedTrials).toBe(77);
    expect(a.quality.balanceReconciles).toBe(true);
  });
  it("handles empty histories safely", () => {
    const a = analyzeSession(synthetic([]));
    expect(a.core.advantageousChoiceRate).toBeNull();
    expect(a.choiceProfile.frequencyContextShift).toBeNull();
    expect(a.quality.responseTime.median).toBeNull();
    expect(a.sequence.longestSingleDeckRun).toBe(0);
    expect(ratio(0, 0)).toBeNull();
  });
  it("uses exact half and block boundaries with an odd planned count", () => {
    const a = analyzeSession(
      synthetic([...Array(25).fill("A"), ...Array(26).fill("D")], 51),
    );
    expect(a.core.firstHalf.count).toBe(25);
    expect(a.core.secondHalf.count).toBe(26);
    expect(a.core.learningDelta).toBe(1);
    expect(
      a.stages[0].blocks.map((b) => [b.from, b.to, b.count, b.score]),
    ).toEqual([
      [1, 20, 20, -20],
      [21, 40, 20, 10],
      [41, 51, 11, 11],
    ]);
  });
  it("sorts a copy before analysis", () => {
    const r = sample();
    r.trials.reverse();
    expect(analyzeSession(r).sequence.sustainedAdvantageousOnset).toBe(55);
    expect(r.trials[0].sequence).toBe(100);
  });
  it("does not join runs across stage boundaries or missing choices", () => {
    const r = synthetic(Array(100).fill("C"), 100, 2);
    expect(analyzeSession(r).sequence.longestSingleDeckRun).toBe(50);
    expect(analyzeSession(r).quality.warnings).toEqual([]);
    r.trials.splice(25, 1);
    expect(analyzeSession(r).sequence.sustainedAdvantageousOnset).toBeNull();
    expect(analyzeSequence(r.trials, false).longestAdvantageousRun).toBe(50);
  });
});

describe("feedback eligibility and return latency", () => {
  it("distinguishes punishment from net loss and excludes a final loss", () => {
    const r = synthetic(["C", "C", "B", "D", "B"]);
    r.trials[0].loss = 25; // Punishment with a positive net.
    r.trials[2].loss = 200;
    r.trials[4].loss = 300; // No eligible next choice.
    const f = analyzeFeedback(r.trials);
    expect(f.punishmentTransitions).toBe(2);
    expect(f.punishmentStayRate).toBe(0.5);
    expect(f.punishmentSwitchRate).toBe(0.5);
    expect(f.netNegativeSwitchRate).toBe(1);
    expect(f.negativeTransitions).toBe(1);
    const b = f.salientPunishmentEvents.find((e) => e.trial === 3)!;
    expect(b.returnLatency).toBe(2);
    expect(b.selectionsBeforeReturn).toBe(1);
    expect(b.nextChoices).toEqual(["D", "B"]);
    const last = f.salientPunishmentEvents.find((e) => e.trial === 5)!;
    expect(last.nextChoiceSwitched).toBeNull();
    expect(last.returnLatency).toBeNull();
  });
  it("reports immediate return as one trial later and zero intervening choices", () => {
    const r = synthetic(["A", "A"]);
    r.trials[0].loss = 100;
    const e = analyzeFeedback(r.trials).salientPunishmentEvents[0];
    expect(e.returnLatency).toBe(1);
    expect(e.selectionsBeforeReturn).toBe(0);
    expect(e.nextChoiceSwitched).toBe(false);
  });
  it("stops follow-up at a gap or stage boundary and breaks tied losses by trial", () => {
    const r = synthetic(["A", "C", "D", "A"], 4, 2);
    r.trials.forEach((row) => {
      row.loss = 100;
    });
    const f = analyzeFeedback(r.trials, 2);
    expect(f.punishmentTransitions).toBe(2);
    expect(f.salientPunishmentEvents.map((e) => e.trial)).toEqual([1, 2]);
    expect(f.salientPunishmentEvents[1].nextChoices).toEqual([]);
    r.trials.splice(1, 1);
    expect(
      analyzeFeedback(r.trials).salientPunishmentEvents[0].nextChoices,
    ).toEqual([]);
  });
});

describe("quality checks and response times", () => {
  it("calculates interpolated quartiles, ignores missing RT, and counts fast responses without invalidating choices", () => {
    const r = synthetic(["A", "B", "C", "D", "C"]);
    [0, 100, 200, 400, null].forEach((n, i) => {
      r.trials[i].responseTimeMs = n;
    });
    r.trials[4].afterInterruption = true;
    r.interruptions = [
      {
        id: "event",
        sessionId: r.session.id,
        type: "hidden",
        at: r.session.createdAt,
      },
    ];
    const q = validateSession(r);
    expect(q.responseTime).toMatchObject({
      median: 150,
      q1: 75,
      q3: 250,
      iqr: 175,
      min: 0,
      max: 400,
      count: 4,
      missing: 1,
      fastCount: 2,
      fastThresholdMs: FAST_RESPONSE_THRESHOLD_MS,
    });
    expect(q.interruptions).toBe(1);
    expect(q.afterInterruptionCount).toBe(1);
    expect(q.behavioralDataUsable).toBe(true);
    expect(validateSession(r, 100).responseTime.fastCount).toBe(1);
    expect(quantile([10], 0.25)).toBe(10);
    expect(quantile([], 0.5)).toBeNull();
  });
  it("detects malformed trials and RT without NaN in the derived export", () => {
    const r = sample();
    r.trials[0].gain = NaN;
    r.trials[1].responseTimeMs = -1;
    const a = analyzeSession(r);
    expect(a.quality.malformedTrials).toBe(1);
    expect(a.quality.malformedResponseTimes).toBe(1);
    expect(a.quality.behavioralDataUsable).toBe(false);
    expect(a.quality.recomputedFinalBalance).toBeNull();
    expect(a.total.count).toBe(99);
    expect(JSON.stringify(a)).not.toMatch(/NaN|Infinity/);
  });
  it("detects changed balances, deck positions, schedule outcomes, and counters", () => {
    const r = sample();
    r.session.balance++;
    r.trials[0].deckPosition++;
    r.trials[0].gain++;
    r.session.trialCount++;
    const q = validateSession(r);
    expect(q.balanceReconciles).toBe(false);
    expect(q.positionsReconcile).toBe(false);
    expect(q.outcomesReconcile).toBe(false);
    expect(q.countersReconcile).toBe(false);
  });
  it("checks missing, duplicate, and wrong stage sequence entries", () => {
    const r = sample();
    r.trials.splice(10, 1);
    r.trials[0].stageSequence = 2;
    r.trials[1].id = r.trials[0].id;
    const q = validateSession(r);
    expect(q.missingTrials).toBe(1);
    expect(q.sequenceValid).toBe(false);
  });
  it.each([true, false])(
    "reconciles stage balances and positions when reset=%s",
    (reset) => {
      const r = synthetic(Array(100).fill("D"), 100, 2, reset);
      expect(analyzeSession(r).quality.warnings).toEqual([]);
      expect(analyzeSession(r).quality.recomputedFinalBalance).toBe(
        reset ? 4500 : 7000,
      );
    },
  );
  it("handles advancement to an empty stage", () => {
    const r = synthetic(Array(50).fill("C"), 100, 2);
    Object.assign(r.session, {
      stage: 2,
      stageTrialCount: 0,
      positions: emptyPositions(),
      balance: 2000,
      status: "active",
    });
    const q = validateSession(r);
    expect(q.balanceReconciles).toBe(true);
    expect(q.positionsReconcile).toBe(true);
    expect(q.countersReconcile).toBe(true);
  });
  it("supports named options and rejects invalid options", () => {
    expect(
      analyzeSession(sample(), { salientLossCount: 1 }).feedback
        .salientPunishmentEvents,
    ).toHaveLength(1);
    expect(() => analyzeSession(sample(), { fastThresholdMs: -1 })).toThrow(
      RangeError,
    );
    expect(() => analyzeSession(sample(), { salientLossCount: 0.5 })).toThrow(
      RangeError,
    );
  });
});

describe("deterministic localized behavioral summaries", () => {
  it("describes the source session with measured changes and exact onset", () => {
    const a = analyzeSession(sample()),
      en = behavioralSummary(a, "en"),
      tr = behavioralSummary(a, "tr");
    expect(en).toContain("60%");
    expect(en).toContain("92%");
    expect(en).toContain("32 percentage points");
    expect(en).toContain("from trial 55 through the end (46 choices)");
    expect(tr).toContain("%60");
    expect(tr).toContain("%92");
    expect(tr).toContain("32 yüzde puan");
    expect(tr).toContain("55. seçimden");
  });
  it("describes stable neutral, B-heavy, D-heavy, and C-heavy patterns", () => {
    const summary = (decks: DeckId[]) =>
      behavioralSummary(analyzeSession(synthetic(decks)), "en");
    expect(
      summary(
        Array.from(
          { length: 100 },
          (_, i) => (["A", "C", "B", "D"] as DeckId[])[i % 4],
        ),
      ),
    ).toContain("stayed at 50%");
    expect(summary(Array(100).fill("B"))).toContain("deck B (100%)");
    expect(summary(Array(100).fill("D"))).toContain(
      "D was selected more often than C (100%)",
    );
    expect(summary(Array(100).fill("C"))).toContain(
      "C was selected more often than D (100%)",
    );
    expect(summary(Array(100).fill("A"))).toContain(
      "No choices from advantageous decks",
    );
  });
  it("describes decline and incomplete or unusable data without forced interpretation", () => {
    const r = synthetic([...Array(50).fill("C"), ...Array(50).fill("B")]);
    expect(behavioralSummary(analyzeSession(r), "en")).toContain(
      "fell from 100%",
    );
    expect(behavioralSummary(analyzeSession(synthetic([])), "en")).toContain(
      "not enough recorded choices",
    );
    r.trials[0].sequence = 10;
    expect(behavioralSummary(analyzeSession(r), "en")).toContain(
      "inconsistencies",
    );
  });
});
