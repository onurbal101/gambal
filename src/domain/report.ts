import { emptyPositions } from "./types";
import type { ScoreSegment, Session, SessionReport, Trial } from "./types";
export function segment(
  trials: Trial[],
  from: number,
  to: number,
): ScoreSegment {
  const counts = emptyPositions();
  for (const trial of trials) counts[trial.deck]++;
  const count = trials.length,
    score = counts.C + counts.D - counts.A - counts.B;
  return {
    from,
    to,
    count,
    counts,
    score,
    range: [-count, count],
    rescaledScore: count ? (100 * score) / count : null,
    advantageousPercent: count ? (100 * (counts.C + counts.D)) / count : null,
    gains: trials.reduce((n, t) => n + t.gain, 0),
    losses: trials.reduce((n, t) => n + t.loss, 0),
  };
}
export function report(session: Session, trials: Trial[]): SessionReport {
  const n = session.task.procedure.trialsPerStage;
  return {
    total: segment(trials, 1, n * session.task.procedure.stages),
    finalBalance: session.balance,
    incomplete: session.status !== "completed",
    stages: Array.from({ length: session.task.procedure.stages }, (_, i) => {
      const rows = trials.filter((t) => t.stage === i + 1);
      const half = Math.floor(n / 2);
      const slice = (from: number, to: number) =>
        segment(
          rows.filter((t) => t.stageSequence >= from && t.stageSequence <= to),
          from,
          to,
        );
      return {
        stage: i + 1,
        total: slice(1, n),
        firstHalf: slice(1, half),
        secondHalf: slice(half + 1, n),
        blocks: Array.from({ length: Math.ceil(n / 20) }, (_, j) =>
          slice(j * 20 + 1, Math.min((j + 1) * 20, n)),
        ),
      };
    }),
  };
}
