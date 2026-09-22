import { afterEach, describe, it, expect } from "vitest";
import Dexie from "dexie";
import { GambalDB, LocalRepository } from "../src/storage/repository";
import { createSession } from "../src/domain/engine";
import { getTasks } from "../src/domain/tasks";
import { decodeBackup, encodeBackup, trialsCsv } from "../src/storage/backup";
const databases: GambalDB[] = [];
function setup() {
  let now = 10000;
  const db = new GambalDB("test-" + crypto.randomUUID());
  databases.push(db);
  return {
    db,
    repo: new LocalRepository(db, () => now),
    tick: (n: number) => {
      now += n;
    },
  };
}
const make = async () =>
  createSession((await getTasks())[0], { code: "TEST" }, "self", "en", "light");
const command = () => ({
  id: crypto.randomUUID(),
  deck: "A" as const,
  selectedAt: new Date().toISOString(),
  responseTimeMs: 10,
  afterInterruption: false,
});
afterEach(async () => {
  for (const db of databases.splice(0)) await db.delete();
});
describe("storage transactions", () => {
  it("commits and deduplicates exactly one choice", async () => {
    const { repo } = setup(),
      s = await make();
    await repo.create(s);
    await repo.claim(s.id, "one");
    const c = command();
    await repo.commit(s.id, "one", 0, c);
    await repo.commit(s.id, "one", 0, c);
    const saved = await repo.get(s.id);
    expect(saved.trials).toHaveLength(1);
    expect(saved.session.balance).toBe(2100);
  });
  it("allows one writer and rejects expired or stale writers", async () => {
    const { repo, tick } = setup(),
      s = await make();
    await repo.create(s);
    expect(await repo.claim(s.id, "one")).toBe(true);
    expect(await repo.claim(s.id, "two")).toBe(false);
    await expect(repo.commit(s.id, "two", 0, command())).rejects.toThrow(
      "locked",
    );
    tick(15001);
    expect(await repo.claim(s.id, "two")).toBe(true);
    await expect(repo.commit(s.id, "one", 0, command())).rejects.toThrow(
      "locked",
    );
    await repo.commit(s.id, "two", 0, command());
    tick(1000);
    await expect(repo.commit(s.id, "two", 0, command())).rejects.toThrow(
      "conflict",
    );
  });
  it("rolls back both tables on a failed session write, then retries", async () => {
    const { repo, db } = setup(),
      s = await make();
    await repo.create(s);
    await repo.claim(s.id, "one");
    const c = command();
    const fail = () => {
      throw new Error("disk full");
    };
    db.sessions.hook("updating", fail);
    await expect(repo.commit(s.id, "one", 0, c)).rejects.toThrow();
    expect((await repo.get(s.id)).trials).toHaveLength(0);
    expect((await repo.get(s.id)).session.trialCount).toBe(0);
    db.sessions.hook("updating").unsubscribe(fail);
    await repo.commit(s.id, "one", 0, c);
    expect((await repo.get(s.id)).trials).toHaveLength(1);
  });
  it("recovers deck positions and interruption history", async () => {
    const { repo } = setup(),
      s = await make();
    await repo.create(s);
    await repo.claim(s.id, "one");
    await repo.commit(s.id, "one", 0, command());
    await repo.release(s.id, "one");
    await repo.claim(s.id, "two");
    await repo.interrupt(s.id, "two", "recovery");
    const record = await repo.get(s.id);
    expect(record.session.positions.A).toBe(1);
    expect(record.interruptions[0].type).toBe("recovery");
  });
  it("cannot delete an owned session", async () => {
    const { repo } = setup(),
      s = await make();
    await repo.create(s);
    await repo.claim(s.id, "one");
    await expect(repo.remove(s.id)).rejects.toThrow("locked");
    await repo.release(s.id, "one");
    await repo.remove(s.id);
    expect(await repo.list()).toHaveLength(0);
  });
  it("migrates v1 without discarding trial data", async () => {
    const name = "migration-" + crypto.randomUUID(),
      old = new Dexie(name);
    old
      .version(1)
      .stores({
        sessions: "id,updatedAt,status",
        trials: "id,sessionId,[sessionId+sequence]",
      });
    const s = await make();
    await old
      .table("sessions")
      .add({
        ...s,
        schemaVersion: 1,
        feedbackUntil: undefined,
        stageAvailableAt: undefined,
      });
    old.close();
    const db = new GambalDB(name);
    databases.push(db);
    await db.open();
    const recovered = await db.sessions.get(s.id);
    expect(recovered?.schemaVersion).toBe(2);
    expect(recovered?.feedbackUntil).toBe(0);
    expect(recovered?.participant.code).toBe("TEST");
  });
});
describe("backups", () => {
  it("round trips and preserves existing identical records", async () => {
    const { repo } = setup(),
      s = await make();
    await repo.create(s);
    await repo.claim(s.id, "one");
    await repo.commit(s.id, "one", 0, command());
    const r = await repo.get(s.id),
      decoded = await decodeBackup(encodeBackup([r]));
    expect(decoded).toEqual([r]);
    expect(await repo.importRecords(decoded)).toBe(0);
    const target = setup().repo;
    expect(await target.importRecords(decoded)).toBe(1);
    expect(await target.get(s.id)).toEqual(r);
  });
  it("rejects altered outcomes, false verification and duplicate IDs", async () => {
    const { repo } = setup(),
      s = await make();
    await repo.create(s);
    await repo.claim(s.id, "one");
    await repo.commit(s.id, "one", 0, command());
    const r = await repo.get(s.id);
    const altered = structuredClone(r);
    altered.trials[0].gain = 999;
    await expect(decodeBackup(encodeBackup([altered]))).rejects.toThrow();
    const forged = structuredClone(r);
    forged.session.task.verification = "verified";
    await expect(decodeBackup(encodeBackup([forged]))).rejects.toThrow(
      "unknown-task",
    );
    await expect(decodeBackup(encodeBackup([r, r]))).rejects.toThrow();
  });
  it("rolls back imports on conflicting IDs", async () => {
    const { repo } = setup(),
      s = await make(),
      other = await make();
    await repo.create(s);
    const record = await repo.get(s.id);
    record.session.participant.code = "CHANGED";
    await expect(
      repo.importRecords([
        { session: other, trials: [], interruptions: [] },
        record,
      ]),
    ).rejects.toThrow("import-conflict");
    expect(await repo.list()).toHaveLength(1);
  });
  it("escapes CSV formulas while keeping numeric losses numeric", async () => {
    const { repo } = setup(),
      s = await make();
    s.participant.code = "=1+1";
    await repo.create(s);
    await repo.claim(s.id, "one");
    await repo.commit(s.id, "one", 0, command());
    expect(trialsCsv([await repo.get(s.id)])).toContain('"\'=1+1"');
  });
});
