import { canonical } from "../domain/canonical";
import { z } from "zod";
import { getTasks } from "../domain/tasks";
import { TaskError } from "../domain/engine";
import { DECKS, emptyPositions } from "../domain/types";
import type { SessionRecord } from "../domain/types";
const integer = z.number().int().safe(),
  natural = integer.nonnegative(),
  stamp = z.iso.datetime(),
  id = z.uuid();
const positions = z
  .object({ A: natural, B: natural, C: natural, D: natural })
  .strict();
const card = z.object({ gain: natural, loss: natural }).strict();
const translated = z
  .object({ tr: z.string().max(4000), en: z.string().max(4000) })
  .strict();
const task = z
  .object({
    id: z.string().max(100),
    revision: natural,
    title: translated,
    verification: z.enum(["legacy-preserved", "verified", "unavailable"]),
    reason: translated.optional(),
    sources: z.array(z.string().max(1000)).max(20),
    decks: z
      .object({
        A: z.array(card).max(1000),
        B: z.array(card).max(1000),
        C: z.array(card).max(1000),
        D: z.array(card).max(1000),
      })
      .strict(),
    deckChecksum: z.string().nullable(),
    procedure: z
      .object({
        startingBalance: integer,
        trialsPerStage: natural.max(1000),
        stages: natural.max(10),
        exhaustion: z.literal("disable"),
        resetBetweenStages: z.boolean(),
        breakMs: natural,
        feedbackMs: natural.optional(),
      })
      .strict(),
    presentation: z.object({ id: z.string(), feedbackMs: natural }).strict(),
    instructions: translated,
  })
  .strict();
const session = z
  .object({
    id,
    schemaVersion: z.literal(2),
    task,
    participant: z
      .object({
        code: z.string().min(1).max(80),
        name: z.string().max(200).optional(),
        age: natural.max(120).optional(),
        sex: z.string().max(100).optional(),
        education: natural.max(60).optional(),
        researcher: z.string().max(500).optional(),
      })
      .strict(),
    mode: z.enum(["self", "research"]),
    language: z.enum(["tr", "en"]),
    theme: z.enum(["light", "dark"]),
    status: z.enum(["active", "break", "completed", "stopped"]),
    createdAt: stamp,
    updatedAt: stamp,
    endedAt: stamp.nullable(),
    stage: natural.min(1),
    trialCount: natural,
    stageTrialCount: natural,
    balance: integer,
    positions,
    revision: natural,
    feedbackUntil: natural,
    stageAvailableAt: natural,
  })
  .strict();
const trial = z
  .object({
    id,
    sessionId: id,
    sequence: natural.min(1),
    stage: natural.min(1),
    stageSequence: natural.min(1),
    deck: z.enum(DECKS),
    deckPosition: natural.min(1),
    gain: natural,
    loss: natural,
    balance: integer,
    selectedAt: stamp,
    responseTimeMs: z.number().finite().nonnegative().nullable(),
    afterInterruption: z.boolean(),
  })
  .strict();
const event = z
  .object({
    id,
    sessionId: id,
    type: z.enum([
      "recovery",
      "hidden",
      "visible",
      "help",
      "storage-error",
      "lease-lost",
    ]),
    at: stamp,
  })
  .strict();
const backup = z
  .object({
    format: z.literal("gambal-backup"),
    version: z.literal(1),
    exportedAt: stamp,
    records: z
      .array(
        z
          .object({
            session,
            trials: z.array(trial).max(10000),
            interruptions: z.array(event).max(10000),
          })
          .strict(),
      )
      .max(500),
  })
  .strict();
export function encodeBackup(records: SessionRecord[]) {
  return JSON.stringify(
    {
      format: "gambal-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      records,
    },
    null,
    2,
  );
}
export async function decodeBackup(text: string): Promise<SessionRecord[]> {
  if (new TextEncoder().encode(text).length > 10 * 1024 * 1024)
    throw new TaskError("invalid-backup");
  const parsed = backup.safeParse(JSON.parse(text));
  if (!parsed.success) throw new TaskError("invalid-backup");
  const known = await getTasks(),
    ids = new Set<string>();
  for (const record of parsed.data.records) {
    const s = record.session;
    const definition = known.find((t) => t.id === s.task.id);
    if (
      !definition ||
      definition.verification === "unavailable" ||
      canonical(definition) !== canonical(s.task)
    )
      throw new TaskError("unknown-task");
    if (ids.has(s.id)) throw new TaskError("invalid-backup");
    ids.add(s.id);
    const p = s.task.procedure;
    let pos = emptyPositions(),
      bal = p.startingBalance,
      stage = 1,
      stageCount = 0;
    for (const [i, row] of record.trials.entries()) {
      if (stageCount === p.trialsPerStage) {
        stage++;
        stageCount = 0;
        if (p.resetBetweenStages) {
          pos = emptyPositions();
          bal = p.startingBalance;
        }
      }
      const card = s.task.decks[row.deck][pos[row.deck]];
      if (!card) throw new TaskError("invalid-backup");
      pos[row.deck]++;
      stageCount++;
      bal += card.gain - card.loss;
      if (
        ids.has(row.id) ||
        row.sessionId !== s.id ||
        row.sequence !== i + 1 ||
        row.stage !== stage ||
        row.stageSequence !== stageCount ||
        row.deckPosition !== pos[row.deck] ||
        row.gain !== card.gain ||
        row.loss !== card.loss ||
        row.balance !== bal
      )
        throw new TaskError("invalid-backup");
      ids.add(row.id);
    }
    if (
      s.stage === stage + 1 &&
      stageCount === p.trialsPerStage &&
      s.stageTrialCount === 0
    ) {
      stage++;
      stageCount = 0;
      if (p.resetBetweenStages) {
        pos = emptyPositions();
        bal = p.startingBalance;
      }
    }
    if (
      s.stage !== stage ||
      stage > p.stages ||
      s.stageTrialCount !== stageCount ||
      s.trialCount !== record.trials.length ||
      s.balance !== bal ||
      DECKS.some((d) => s.positions[d] !== pos[d]) ||
      s.revision < s.trialCount
    )
      throw new TaskError("invalid-backup");
    const terminal = s.status === "completed" || s.status === "stopped";
    if (
      terminal !== !!s.endedAt ||
      (s.status === "completed" &&
        s.trialCount !== p.stages * p.trialsPerStage) ||
      (s.status === "active" && stageCount >= p.trialsPerStage) ||
      (s.status === "break" &&
        (stageCount !== p.trialsPerStage || stage >= p.stages))
    )
      throw new TaskError("invalid-backup");
    for (const e of record.interruptions) {
      if (e.sessionId !== s.id || ids.has(e.id))
        throw new TaskError("invalid-backup");
      ids.add(e.id);
    }
  }
  return parsed.data.records as SessionRecord[];
}
function cell(value: unknown) {
  let s = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(s) && typeof value !== "number") s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
export function trialsCsv(records: SessionRecord[]) {
  const header = [
    "session_id",
    "participant_code",
    "task_id",
    "task_revision",
    "deck_checksum",
    "presentation",
    "feedback_ms",
    "language",
    "mode",
    "status",
    "stage",
    "trial",
    "stage_trial",
    "deck",
    "deck_position",
    "gain",
    "loss",
    "balance",
    "selected_at",
    "response_ms",
    "after_interruption",
  ];
  return (
    "\uFEFF" +
    [
      header.map(cell).join(","),
      ...records.flatMap(({ session: s, trials }) =>
        trials.map((t) =>
          [
            s.id,
            s.participant.code,
            s.task.id,
            s.task.revision,
            s.task.deckChecksum,
            s.task.presentation.id,
            s.task.procedure.feedbackMs ?? s.task.presentation.feedbackMs,
            s.language,
            s.mode,
            s.status,
            t.stage,
            t.sequence,
            t.stageSequence,
            t.deck,
            t.deckPosition,
            t.gain,
            t.loss,
            t.balance,
            t.selectedAt,
            t.responseTimeMs,
            t.afterInterruption,
          ]
            .map(cell)
            .join(","),
        ),
      ),
    ].join("\r\n")
  );
}
export function download(text: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
