import { DECKS, emptyPositions } from "./types";
import type {
  ChoiceCommand,
  Participant,
  Session,
  TaskDefinition,
  Trial,
  Language,
  Theme,
} from "./types";
export class TaskError extends Error {
  constructor(public code: string) {
    super(code);
    this.name = "TaskError";
  }
}
export function createSession(
  task: TaskDefinition,
  participant: Participant,
  mode: Session["mode"],
  language: Language,
  theme: Theme,
  now = new Date(),
): Session {
  if (task.verification === "unavailable" || !task.deckChecksum)
    throw new TaskError("unavailable");
  const p = task.procedure;
  if (
    !Number.isInteger(p.trialsPerStage) ||
    p.trialsPerStage < 1 ||
    !Number.isInteger(p.stages) ||
    p.stages < 1 ||
    DECKS.reduce((n, d) => n + task.decks[d].length, 0) < p.trialsPerStage
  )
    throw new TaskError("invalid-task");
  return {
    id: crypto.randomUUID(),
    schemaVersion: 2,
    task: structuredClone(task),
    participant: structuredClone(participant),
    mode,
    language,
    theme,
    status: "active",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    endedAt: null,
    stage: 1,
    trialCount: 0,
    stageTrialCount: 0,
    balance: p.startingBalance,
    positions: emptyPositions(),
    revision: 0,
    feedbackUntil: 0,
    stageAvailableAt: 0,
  };
}
export function applyChoice(
  session: Session,
  command: ChoiceCommand,
  now = Date.now(),
): { session: Session; trial: Trial } {
  if (session.status !== "active") throw new TaskError("not-active");
  if (now < session.feedbackUntil) throw new TaskError("feedback");
  if (session.stageTrialCount >= session.task.procedure.trialsPerStage)
    throw new TaskError("finished");
  const card =
    session.task.decks[command.deck]?.[session.positions[command.deck]];
  if (!card) throw new TaskError("exhausted");
  if (
    !Number.isFinite(Date.parse(command.selectedAt)) ||
    (command.responseTimeMs !== null &&
      (!Number.isFinite(command.responseTimeMs) || command.responseTimeMs < 0))
  )
    throw new TaskError("invalid-command");
  const next = structuredClone(session);
  next.positions[command.deck]++;
  next.stageTrialCount++;
  next.trialCount++;
  next.revision++;
  next.balance += card.gain - card.loss;
  next.updatedAt = new Date(now).toISOString();
  next.feedbackUntil =
    now + (next.task.procedure.feedbackMs ?? next.task.presentation.feedbackMs);
  const trial: Trial = {
    ...command,
    sessionId: session.id,
    sequence: next.trialCount,
    stage: next.stage,
    stageSequence: next.stageTrialCount,
    deckPosition: next.positions[command.deck],
    gain: card.gain,
    loss: card.loss,
    balance: next.balance,
  };
  if (next.stageTrialCount === next.task.procedure.trialsPerStage) {
    if (next.stage === next.task.procedure.stages) {
      next.status = "completed";
      next.endedAt = next.updatedAt;
    } else {
      next.status = "break";
      next.stageAvailableAt = next.feedbackUntil + next.task.procedure.breakMs;
    }
  }
  return { session: next, trial };
}
export function advanceStage(session: Session, now = Date.now()): Session {
  if (session.status !== "break" || now < session.stageAvailableAt)
    throw new TaskError("stage-not-ready");
  const next = structuredClone(session);
  next.stage++;
  next.stageTrialCount = 0;
  next.status = "active";
  next.revision++;
  next.updatedAt = new Date(now).toISOString();
  if (next.task.procedure.resetBetweenStages) {
    next.balance = next.task.procedure.startingBalance;
    next.positions = emptyPositions();
  }
  return next;
}
