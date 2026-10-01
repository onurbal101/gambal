import { report, segment } from "./report";
import { DECKS, emptyPositions } from "./types";
import type { DeckId, SessionRecord, Trial } from "./types";

export const FAST_RESPONSE_THRESHOLD_MS = 150;
export const SALIENT_LOSS_COUNT = 3;
export const FOLLOWING_CHOICE_COUNT = 5;
export const ANALYSIS_VERSION = 1;
export const ratio = (numerator: number, denominator: number): number | null =>
  denominator > 0 ? numerator / denominator : null;
const advantageous = (deck: DeckId) => deck === "C" || deck === "D";
const natural = (value: number) => Number.isSafeInteger(value) && value >= 0;

/** Linear interpolation at (n - 1) * p, including endpoints. */
export function quantile(sorted: number[], p: number): number | null {
  if (!sorted.length) return null;
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  return (
    sorted[lower] + (sorted[Math.ceil(index)] - sorted[lower]) * (index - lower)
  );
}

function validTrial(row: Trial, record: SessionRecord) {
  const p = record.session.task.procedure;
  return (
    DECKS.includes(row.deck) &&
    natural(row.sequence) &&
    row.sequence > 0 &&
    natural(row.stage) &&
    row.stage > 0 &&
    row.stage <= p.stages &&
    natural(row.stageSequence) &&
    row.stageSequence > 0 &&
    row.stageSequence <= p.trialsPerStage &&
    natural(row.deckPosition) &&
    row.deckPosition > 0 &&
    natural(row.gain) &&
    natural(row.loss) &&
    Number.isSafeInteger(row.balance) &&
    row.sessionId === record.session.id &&
    Number.isFinite(Date.parse(row.selectedAt))
  );
}

/** Read-only checks. Invalid RT values do not remove otherwise valid choices. */
export function validateSession(
  record: SessionRecord,
  fastThresholdMs = FAST_RESPONSE_THRESHOLD_MS,
) {
  const { session, trials, interruptions } = record;
  const p = session.task.procedure;
  const expectedCount = p.trialsPerStage * p.stages;
  const sorted = [...trials].sort((a, b) => a.sequence - b.sequence);
  let positions = emptyPositions(),
    balance = p.startingBalance;
  let stage = 1,
    stageCount = 0,
    malformedTrials = 0,
    malformedResponseTimes = 0;
  let balancesValid = true,
    positionsValid = true,
    outcomesValid = true,
    sequenceValid = true;
  const ids = new Set<string>();
  const responseTimes: number[] = [];
  let missingResponseTimes = 0;
  for (const [i, row] of sorted.entries()) {
    if (!validTrial(row, record)) malformedTrials++;
    if (row.responseTimeMs === null || row.responseTimeMs === undefined)
      missingResponseTimes++;
    else if (!Number.isFinite(row.responseTimeMs) || row.responseTimeMs < 0)
      malformedResponseTimes++;
    else responseTimes.push(row.responseTimeMs);
    if (stageCount === p.trialsPerStage) {
      stage++;
      stageCount = 0;
      if (p.resetBetweenStages) {
        positions = emptyPositions();
        balance = p.startingBalance;
      }
    }
    stageCount++;
    if (
      row.sequence !== i + 1 ||
      row.stage !== stage ||
      row.stageSequence !== stageCount ||
      ids.has(row.id)
    )
      sequenceValid = false;
    ids.add(row.id);
    if (!DECKS.includes(row.deck)) {
      outcomesValid = false;
      positionsValid = false;
      balancesValid = false;
      continue;
    }
    positions[row.deck]++;
    if (row.deckPosition !== positions[row.deck]) positionsValid = false;
    const card = session.task.decks[row.deck][positions[row.deck] - 1];
    if (!card || card.gain !== row.gain || card.loss !== row.loss)
      outcomesValid = false;
    balance += row.gain - row.loss;
    if (row.balance !== balance) balancesValid = false;
  }
  // A session can have advanced to an empty stage before any new choice.
  if (
    session.stage === stage + 1 &&
    stageCount === p.trialsPerStage &&
    session.stageTrialCount === 0
  ) {
    stage++;
    stageCount = 0;
    if (p.resetBetweenStages) {
      positions = emptyPositions();
      balance = p.startingBalance;
    }
  }
  positionsValid &&= DECKS.every((d) => positions[d] === session.positions[d]);
  const countersReconcile =
    session.trialCount === trials.length &&
    session.stage === stage &&
    session.stageTrialCount === stageCount &&
    stage <= p.stages;
  const balanceReconciles = balancesValid && balance === session.balance;
  const missingTrials = Array.from(
    { length: Math.min(expectedCount, session.trialCount) },
    (_, i) => i + 1,
  ).filter((n) => !sorted.some((row) => row.sequence === n)).length;
  const trialCountValid = trials.length === expectedCount;
  const warnings: QualityWarning[] = [];
  if (session.status !== "completed") warnings.push("incompleteSession");
  if (!trialCountValid) warnings.push("trialCountMismatch");
  if (missingTrials) warnings.push("missingTrials");
  if (malformedTrials || malformedResponseTimes)
    warnings.push("malformedValues");
  if (!sequenceValid || !countersReconcile) warnings.push("sequenceMismatch");
  if (!balanceReconciles) warnings.push("balanceMismatch");
  if (!positionsValid) warnings.push("positionMismatch");
  if (!outcomesValid) warnings.push("outcomeMismatch");
  responseTimes.sort((a, b) => a - b);
  const q1 = quantile(responseTimes, 0.25),
    q3 = quantile(responseTimes, 0.75);
  return {
    expectedCount,
    recordedCount: trials.length,
    trialCountValid,
    countersReconcile,
    missingTrials,
    unobservedTrials: Math.max(0, expectedCount - trials.length),
    malformedTrials,
    malformedResponseTimes,
    sequenceValid,
    balanceReconciles,
    recomputedFinalBalance: Number.isFinite(balance) ? balance : null,
    positionsReconcile: positionsValid,
    outcomesReconcile: outcomesValid,
    interruptions: interruptions.length,
    afterInterruptionCount: trials.filter((row) => row.afterInterruption)
      .length,
    responseTime: {
      count: responseTimes.length,
      missing: missingResponseTimes,
      median: quantile(responseTimes, 0.5),
      q1,
      q3,
      iqr: q1 === null || q3 === null ? null : q3 - q1,
      min: responseTimes[0] ?? null,
      max: responseTimes.at(-1) ?? null,
      fastCount: responseTimes.filter((n) => n < fastThresholdMs).length,
      fastThresholdMs,
    },
    behavioralDataUsable:
      !malformedTrials && sequenceValid && countersReconcile,
    warnings,
  };
}
export type QualityWarning =
  | "incompleteSession"
  | "trialCountMismatch"
  | "missingTrials"
  | "malformedValues"
  | "sequenceMismatch"
  | "balanceMismatch"
  | "positionMismatch"
  | "outcomeMismatch";

/** Only adjacent choices in the same stage are eligible; never bridge missing trials. */
export function analyzeFeedback(
  trials: Trial[],
  salientLossCount = SALIENT_LOSS_COUNT,
) {
  let punishmentTransitions = 0,
    punishmentStays = 0,
    negativeTransitions = 0,
    negativeSwitches = 0;
  for (let i = 0; i < trials.length - 1; i++) {
    const row = trials[i],
      next = trials[i + 1];
    if (next.sequence !== row.sequence + 1 || next.stage !== row.stage)
      continue;
    if (row.loss > 0) {
      punishmentTransitions++;
      if (next.deck === row.deck) punishmentStays++;
    }
    if (row.gain - row.loss < 0) {
      negativeTransitions++;
      if (next.deck !== row.deck) negativeSwitches++;
    }
  }
  const punishmentStayRate = ratio(punishmentStays, punishmentTransitions);
  const salientPunishmentEvents = trials
    .filter((row) => row.loss > 0)
    .sort((a, b) => b.loss - a.loss || a.sequence - b.sequence)
    .slice(0, salientLossCount)
    .sort((a, b) => a.sequence - b.sequence)
    .map((row) => {
      const index = trials.indexOf(row);
      const subsequent: Trial[] = [];
      for (let i = index + 1; i < trials.length; i++) {
        if (
          trials[i].stage !== row.stage ||
          trials[i].sequence !== trials[i - 1].sequence + 1
        )
          break;
        subsequent.push(trials[i]);
      }
      const returnIndex = subsequent.findIndex(
        (next) => next.deck === row.deck,
      );
      return {
        trial: row.sequence,
        stage: row.stage,
        deck: row.deck,
        deckPosition: row.deckPosition,
        loss: row.loss,
        nextChoices: subsequent
          .slice(0, FOLLOWING_CHOICE_COUNT)
          .map((next) => next.deck),
        nextChoiceSwitched: subsequent.length
          ? subsequent[0].deck !== row.deck
          : null,
        returnLatency: returnIndex < 0 ? null : returnIndex + 1,
        selectionsBeforeReturn: returnIndex < 0 ? null : returnIndex,
        observedFollowingChoices: subsequent.length,
      };
    });
  return {
    punishmentTransitions,
    punishmentStays,
    punishmentSwitches: punishmentTransitions - punishmentStays,
    punishmentStayRate,
    punishmentSwitchRate:
      punishmentStayRate === null ? null : 1 - punishmentStayRate,
    negativeTransitions,
    negativeSwitches,
    netNegativeSwitchRate: ratio(negativeSwitches, negativeTransitions),
    salientPunishmentEvents,
  };
}

export function analyzeSequence(trials: Trial[], complete: boolean) {
  let longestAdvantageousRun = 0,
    longestSingleDeckRun = 0,
    advantageRun = 0,
    deckRun = 0;
  let previous: Trial | undefined;
  for (const row of trials) {
    const adjacent =
      previous &&
      row.sequence === previous.sequence + 1 &&
      row.stage === previous.stage;
    advantageRun = advantageous(row.deck)
      ? (adjacent ? advantageRun : 0) + 1
      : 0;
    deckRun = adjacent && row.deck === previous!.deck ? deckRun + 1 : 1;
    longestAdvantageousRun = Math.max(longestAdvantageousRun, advantageRun);
    longestSingleDeckRun = Math.max(longestSingleDeckRun, deckRun);
    previous = row;
  }
  // "From trial N through the end" is only stated for a complete, contiguous history.
  let onset: number | null = null;
  if (
    complete &&
    trials.length &&
    trials.every((row, i) => row.sequence === i + 1)
  ) {
    for (let i = trials.length - 1; i >= 0 && advantageous(trials[i].deck); i--)
      onset = trials[i].sequence;
  }
  return {
    longestAdvantageousRun,
    longestSingleDeckRun,
    sustainedAdvantageousOnset: onset,
    sustainedAdvantageousCount: onset === null ? 0 : trials.length - onset + 1,
  };
}

export function analyzeSession(
  record: SessionRecord,
  options: { fastThresholdMs?: number; salientLossCount?: number } = {},
) {
  const fastThresholdMs = options.fastThresholdMs ?? FAST_RESPONSE_THRESHOLD_MS;
  const salientLossCount = options.salientLossCount ?? SALIENT_LOSS_COUNT;
  if (
    !Number.isFinite(fastThresholdMs) ||
    fastThresholdMs < 0 ||
    !natural(salientLossCount)
  )
    throw new RangeError("invalid-analysis-options");
  const quality = validateSession(record, fastThresholdMs);
  const trials = record.trials
    .filter((row) => validTrial(row, record))
    .sort((a, b) => a.sequence - b.sequence);
  const base = report(record.session, trials);
  const expected = quality.expectedCount,
    half = Math.floor(expected / 2);
  const firstHalf = segment(
    trials.filter((row) => row.sequence <= half),
    1,
    half,
  );
  const secondHalf = segment(
    trials.filter((row) => row.sequence > half),
    half + 1,
    expected,
  );
  const advantageRate = (rows: ReturnType<typeof segment>) =>
    ratio(rows.counts.C + rows.counts.D, rows.count);
  const firstRate = advantageRate(firstHalf),
    secondRate = advantageRate(secondHalf);
  const counts = base.total.counts;
  const advantageousFrequentPreference = ratio(counts.C, counts.C + counts.D);
  const disadvantageousFrequentPreference = ratio(
    counts.A,
    counts.A + counts.B,
  );
  const deckOutcomes = Object.fromEntries(
    DECKS.map((deck) => {
      const rows = trials.filter((row) => row.deck === deck);
      const grossGain = rows.reduce((sum, row) => sum + row.gain, 0);
      const losses = rows.reduce((sum, row) => sum + row.loss, 0);
      const punishmentEvents = rows.filter((row) => row.loss > 0).length;
      return [
        deck,
        {
          choices: rows.length,
          choiceRate: ratio(rows.length, trials.length),
          grossGain,
          losses,
          netOutcome: grossGain - losses,
          averageNetOutcome: ratio(grossGain - losses, rows.length),
          punishmentEvents,
          punishmentEventRate: ratio(punishmentEvents, rows.length),
          largestPunishment: rows.length
            ? Math.max(...rows.map((row) => row.loss))
            : null,
        },
      ];
    }),
  ) as Record<DeckId, DeckOutcome>;
  return {
    version: ANALYSIS_VERSION,
    sessionId: record.session.id,
    task: {
      id: record.session.task.id,
      revision: record.session.task.revision,
      deckChecksum: record.session.task.deckChecksum,
    },
    parameters: {
      fastThresholdMs,
      salientLossCount,
      followingChoiceCount: FOLLOWING_CHOICE_COUNT,
      halfBoundary: half,
      blockSize: 20,
      quantileMethod: "linear-(n-1)*p",
      salientLossMethod: "top-N-positive-losses-ties-by-trial",
    },
    ...base,
    core: {
      netScore: base.total.score,
      advantageousChoiceRate: advantageRate(base.total),
      disadvantageousChoiceRate: ratio(counts.A + counts.B, trials.length),
      firstHalf,
      secondHalf,
      firstHalfAdvantageousRate: firstRate,
      secondHalfAdvantageousRate: secondRate,
      learningDelta:
        firstRate === null || secondRate === null
          ? null
          : secondRate - firstRate,
    },
    deckCounts: counts,
    choiceProfile: {
      advantageousFrequentPreference,
      disadvantageousFrequentPreference,
      overallFrequentPreference: ratio(counts.A + counts.C, trials.length),
      frequencyContextShift:
        advantageousFrequentPreference === null ||
        disadvantageousFrequentPreference === null
          ? null
          : advantageousFrequentPreference - disadvantageousFrequentPreference,
    },
    deckOutcomes,
    feedback: analyzeFeedback(trials, salientLossCount),
    sequence: analyzeSequence(
      trials,
      !base.incomplete &&
        quality.trialCountValid &&
        quality.behavioralDataUsable,
    ),
    quality,
  };
}
export interface DeckOutcome {
  choices: number;
  choiceRate: number | null;
  grossGain: number;
  losses: number;
  netOutcome: number;
  averageNetOutcome: number | null;
  punishmentEvents: number;
  punishmentEventRate: number | null;
  largestPunishment: number | null;
}
export type SessionAnalysis = ReturnType<typeof analyzeSession>;
