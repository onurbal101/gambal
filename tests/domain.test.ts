import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { getTasks, checksum } from "../src/domain/tasks";
import { createSession, applyChoice, advanceStage } from "../src/domain/engine";
import { report } from "../src/domain/report";
import { DECKS } from "../src/domain/types";
import type { Session, Trial } from "../src/domain/types";
const make = async () =>
  createSession((await getTasks())[0], { code: "TEST" }, "self", "en", "light");
function choose(s: Session, deck: "A" | "B" | "C" | "D", now = Date.now()) {
  return applyChoice(
    s,
    {
      id: crypto.randomUUID(),
      deck,
      selectedAt: new Date(now).toISOString(),
      responseTimeMs: 150,
      afterInterruption: false,
    },
    now,
  );
}
describe("legacy and protocol gates", () => {
  it("preserves every CSV row and C/D duplication", async () => {
    const task = (await getTasks())[0];
    for (const d of DECKS) {
      const rows = readFileSync(
        `gambal/src/new_iowa/src/decks/deck_${d.toLowerCase()}.csv`,
        "utf8",
      )
        .trim()
        .split(/\r?\n/)
        .slice(1)
        .map((line) => {
          const [gain, loss] = line.split(",").map(Number);
          return { gain, loss };
        });
      expect(task.decks[d]).toEqual(rows);
      expect(rows).toHaveLength(60);
    }
    expect(task.decks.C).toEqual(task.decks.D);
    expect(task.deckChecksum).toBe(await checksum(task.decks));
  });
  it("keeps unverified versions unavailable", async () => {
    for (const task of (await getTasks()).slice(1)) {
      expect(task.verification).toBe("unavailable");
      expect(() =>
        createSession(task, { code: "T" }, "self", "en", "light"),
      ).toThrow("unavailable");
    }
  });
  it("freezes a snapshot by copying input", async () => {
    const task = (await getTasks())[0],
      s = createSession(task, { code: "T" }, "self", "en", "light");
    task.decks.A[0].gain = 999;
    expect(s.task.decks.A[0].gain).toBe(100);
  });
});
describe("choice engine", () => {
  it("saves separate gain and loss and permits negative balances", async () => {
    let s = await make();
    s.balance = 0;
    let row: Trial;
    for (let i = 0; i < 10; i++) {
      ({ session: s, trial: row } = choose(s, "A", 10000 + i * 1000));
    }
    expect(s.balance).toBe(-250);
    expect(row!.gain).toBe(90);
    expect(row!.loss).toBe(350);
  });
  it("blocks rapid choices until the exact feedback boundary", async () => {
    let s = await make();
    s = choose(s, "A", 10000).session;
    expect(() => choose(s, "A", 10899)).toThrow("feedback");
    expect(choose(s, "A", 10900).session.trialCount).toBe(2);
  });
  it("disables exhausted decks without changing the next deck", async () => {
    let s = await make();
    for (let i = 0; i < 60; i++) s = choose(s, "A", 10000 + i * 1000).session;
    expect(() => choose(s, "A", 80000)).toThrow("exhausted");
    const result = choose(s, "B", 80000);
    expect(result.trial.deckPosition).toBe(1);
  });
  it("stops at 100 and rejects extra choices", async () => {
    let s = await make();
    for (let i = 0; i < 100; i++)
      s = choose(s, i % 2 ? "B" : "A", 10000 + i * 1000).session;
    expect(s.status).toBe("completed");
    expect(() => choose(s, "C", 200000)).toThrow("not-active");
  });
  it("supports a protocol-specific interval", async () => {
    let s = await make();
    s.task.procedure.feedbackMs = 1500;
    s = choose(s, "A", 10000).session;
    expect(s.feedbackUntil).toBe(11500);
  });
  it("resets deck positions and balance only at the next stage", async () => {
    let s = await make();
    s.task.procedure = {
      ...s.task.procedure,
      stages: 3,
      trialsPerStage: 2,
      breakMs: 2000,
    };
    s = choose(s, "A", 10000).session;
    s = choose(s, "A", 11000).session;
    expect(s.status).toBe("break");
    expect(() => advanceStage(s, 13899)).toThrow("stage-not-ready");
    s = advanceStage(s, 13900);
    expect(s.stage).toBe(2);
    expect(s.balance).toBe(2000);
    expect(s.positions.A).toBe(0);
    expect(choose(s, "A", 14000).trial.sequence).toBe(3);
  });
});
describe("reports", () => {
  it("uses null for empty percentages", async () => {
    const data = report(await make(), []);
    expect(data.total.rescaledScore).toBeNull();
    expect(data.total.advantageousPercent).toBeNull();
    expect(data.stages[0].blocks).toHaveLength(5);
  });
  it("uses fixed blocks and halves for incomplete sessions", async () => {
    let s = await make();
    const rows: Trial[] = [];
    for (let i = 0; i < 21; i++) {
      const result = choose(s, i < 20 ? "A" : "C", 10000 + i * 1000);
      s = result.session;
      rows.push(result.trial);
    }
    const r = report(s, rows);
    expect(r.stages[0].blocks.map((b) => b.count)).toEqual([20, 1, 0, 0, 0]);
    expect(r.total.score).toBe(-19);
    expect(r.stages[0].firstHalf.count).toBe(21);
    expect(r.stages[0].secondHalf.count).toBe(0);
    expect(r.stages[0].blocks[1].rescaledScore).toBe(100);
    expect(r.incomplete).toBe(true);
  });
});
