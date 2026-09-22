import { canonical } from "../domain/canonical";
import Dexie, { type Table } from "dexie";
import { advanceStage, applyChoice, TaskError } from "../domain/engine";
import type {
  ChoiceCommand,
  Interruption,
  Session,
  SessionRecord,
  Trial,
} from "../domain/types";
export interface Lease {
  sessionId: string;
  owner: string;
  expiresAt: number;
}
export class GambalDB extends Dexie {
  sessions!: Table<Session, string>;
  trials!: Table<Trial, string>;
  interruptions!: Table<Interruption, string>;
  leases!: Table<Lease, string>;
  constructor(name = "gambal-local") {
    super(name);
    this.version(1).stores({
      sessions: "id,updatedAt,status",
      trials: "id,sessionId,[sessionId+sequence]",
    });
    this.version(2)
      .stores({
        sessions: "id,updatedAt,status",
        trials: "id,sessionId,&[sessionId+sequence]",
        interruptions: "id,sessionId",
        leases: "sessionId",
      })
      .upgrade(async (tx) => {
        await tx
          .table("sessions")
          .toCollection()
          .modify((s) => {
            s.schemaVersion = 2;
            s.feedbackUntil ??= 0;
            s.stageAvailableAt ??= 0;
          });
      });
  }
}
export interface SessionRepository {
  list(): Promise<Session[]>;
  get(id: string): Promise<SessionRecord>;
  create(session: Session): Promise<void>;
  claim(id: string, owner: string): Promise<boolean>;
  renew(id: string, owner: string): Promise<boolean>;
  release(id: string, owner: string): Promise<void>;
  commit(
    id: string,
    owner: string,
    revision: number,
    command: ChoiceCommand,
  ): Promise<{ session: Session; trial: Trial }>;
  interrupt(
    id: string,
    owner: string,
    type: Interruption["type"],
  ): Promise<Interruption>;
  stop(id: string, owner: string): Promise<Session>;
  nextStage(id: string, owner: string): Promise<Session>;
  remove(id: string): Promise<void>;
  importRecords(records: SessionRecord[]): Promise<number>;
}
export class LocalRepository implements SessionRepository {
  constructor(
    public db = new GambalDB(),
    private clock = () => Date.now(),
  ) {}
  list() {
    return this.db.sessions.orderBy("updatedAt").reverse().toArray();
  }
  async get(id: string): Promise<SessionRecord> {
    return this.db.transaction(
      "r",
      this.db.sessions,
      this.db.trials,
      this.db.interruptions,
      async () => {
        const session = await this.db.sessions.get(id);
        if (!session) throw new TaskError("missing");
        return {
          session,
          trials: (
            await this.db.trials.where("sessionId").equals(id).toArray()
          ).sort((a, b) => a.sequence - b.sequence),
          interruptions: (
            await this.db.interruptions.where("sessionId").equals(id).toArray()
          ).sort((a, b) => a.at.localeCompare(b.at)),
        };
      },
    );
  }
  async create(session: Session) {
    await this.db.sessions.add(session);
  }
  async claim(id: string, owner: string) {
    return this.db.transaction("rw", this.db.leases, async () => {
      const lease = await this.db.leases.get(id);
      if (lease && lease.owner !== owner && lease.expiresAt > this.clock())
        return false;
      await this.db.leases.put({
        sessionId: id,
        owner,
        expiresAt: this.clock() + 15000,
      });
      return true;
    });
  }
  async renew(id: string, owner: string) {
    return this.db.transaction("rw", this.db.leases, async () => {
      const lease = await this.db.leases.get(id);
      if (!lease || lease.owner !== owner || lease.expiresAt <= this.clock())
        return false;
      await this.db.leases.put({ ...lease, expiresAt: this.clock() + 15000 });
      return true;
    });
  }
  async release(id: string, owner: string) {
    await this.db.transaction("rw", this.db.leases, async () => {
      if ((await this.db.leases.get(id))?.owner === owner)
        await this.db.leases.delete(id);
    });
  }
  private async assertOwner(id: string, owner: string) {
    const lease = await this.db.leases.get(id);
    if (!lease || lease.owner !== owner || lease.expiresAt <= this.clock())
      throw new TaskError("locked");
  }
  async commit(
    id: string,
    owner: string,
    revision: number,
    command: ChoiceCommand,
  ) {
    return this.db.transaction(
      "rw",
      this.db.sessions,
      this.db.trials,
      this.db.leases,
      async () => {
        await this.assertOwner(id, owner);
        const session = await this.db.sessions.get(id);
        if (!session) throw new TaskError("missing");
        const existing = await this.db.trials.get(command.id);
        if (existing) {
          if (
            existing.sessionId !== id ||
            existing.deck !== command.deck ||
            existing.selectedAt !== command.selectedAt
          )
            throw new TaskError("conflict");
          return { session, trial: existing };
        }
        if (session.revision !== revision) throw new TaskError("conflict");
        const result = applyChoice(session, command, this.clock());
        await this.db.trials.add(result.trial);
        await this.db.sessions.put(result.session);
        return result;
      },
    );
  }
  async interrupt(id: string, owner: string, type: Interruption["type"]) {
    return this.db.transaction(
      "rw",
      this.db.leases,
      this.db.interruptions,
      async () => {
        await this.assertOwner(id, owner);
        const event: Interruption = {
          id: crypto.randomUUID(),
          sessionId: id,
          type,
          at: new Date(this.clock()).toISOString(),
        };
        await this.db.interruptions.add(event);
        return event;
      },
    );
  }
  async stop(id: string, owner: string) {
    return this.db.transaction(
      "rw",
      this.db.sessions,
      this.db.leases,
      async () => {
        await this.assertOwner(id, owner);
        const session = await this.db.sessions.get(id);
        if (!session) throw new TaskError("missing");
        if (session.status === "completed" || session.status === "stopped")
          return session;
        const at = new Date(this.clock()).toISOString();
        const next: Session = {
          ...session,
          status: "stopped",
          endedAt: at,
          updatedAt: at,
          revision: session.revision + 1,
        };
        await this.db.sessions.put(next);
        return next;
      },
    );
  }
  async nextStage(id: string, owner: string) {
    return this.db.transaction(
      "rw",
      this.db.sessions,
      this.db.leases,
      async () => {
        await this.assertOwner(id, owner);
        const session = await this.db.sessions.get(id);
        if (!session) throw new TaskError("missing");
        const next = advanceStage(session, this.clock());
        await this.db.sessions.put(next);
        return next;
      },
    );
  }
  async remove(id: string) {
    await this.db.transaction(
      "rw",
      this.db.sessions,
      this.db.trials,
      this.db.interruptions,
      this.db.leases,
      async () => {
        const lease = await this.db.leases.get(id);
        if (lease && lease.expiresAt > this.clock())
          throw new TaskError("locked");
        await this.db.sessions.delete(id);
        await this.db.trials.where("sessionId").equals(id).delete();
        await this.db.interruptions.where("sessionId").equals(id).delete();
        await this.db.leases.delete(id);
      },
    );
  }
  async importRecords(records: SessionRecord[]) {
    return this.db.transaction(
      "rw",
      this.db.sessions,
      this.db.trials,
      this.db.interruptions,
      this.db.leases,
      async () => {
        let added = 0;
        for (const record of records) {
          const id = record.session.id;
          if (await this.db.sessions.get(id)) {
            const current = await this.get(id);
            if (canonical(current) !== canonical(record))
              throw new TaskError("import-conflict");
            continue;
          }
          await this.db.sessions.add(record.session);
          await this.db.trials.bulkAdd(record.trials);
          await this.db.interruptions.bulkAdd(record.interruptions);
          added++;
        }
        return added;
      },
    );
  }
}
export const repository = new LocalRepository();
