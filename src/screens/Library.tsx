import { useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useApp } from "../state/store";
import { text, errorText } from "../i18n";
import { repository } from "../storage/repository";
import { decodeBackup, download, encodeBackup } from "../storage/backup";
import { TaskError } from "../domain/engine";
import type { Session } from "../domain/types";
import { Modal } from "../components/Modal";
export function Library() {
  const s = useApp(),
    t = text(s.language),
    file = useRef<HTMLInputElement>(null);
  const [deleting, setDeleting] = useState<Session | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const fail = (e: unknown) =>
    setError(e instanceof TaskError ? errorText(e.code, t) : t.invalid);
  async function exportAll() {
    setBusy(true);
    try {
      const records = await Promise.all(
        s.sessions.map((session) => repository.get(session.id)),
      );
      download(
        encodeBackup(records),
        `gambal-${new Date().toISOString().slice(0, 10)}.json`,
        "application/json",
      );
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  async function importFile(input: File) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (input.size > 10 * 1024 * 1024) throw new TaskError("invalid-backup");
      const records = await decodeBackup(await input.text());
      await repository.importRecords(records);
      await s.refresh();
      setNotice(t.imported);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
      if (file.current) file.current.value = "";
    }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      await repository.remove(deleting.id);
      setDeleting(null);
      await s.refresh();
    } catch (e) {
      fail(e);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="library">
      <div className="report-title">
        <h1>{t.sessions}</h1>
        <button className="primary" onClick={() => void s.navigate("home")}>
          {t.home}
        </button>
      </div>
      <div className="library-tools">
        <button
          className="text-button"
          disabled={busy}
          onClick={() => file.current?.click()}
        >
          {t.import}
        </button>
        <button
          className="text-button"
          disabled={busy || !s.sessions.length}
          onClick={() => void exportAll()}
        >
          {t.export}
        </button>
        <input
          ref={file}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importFile(f);
          }}
        />
      </div>
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      {!s.sessions.length ? (
        <p className="empty-state">{t.noSessions}</p>
      ) : (
        <div className="session-list">
          {s.sessions.map((session) => {
            const active =
              session.status === "active" || session.status === "break";
            return (
              <article className="session-row" key={session.id}>
                <button
                  className="session-open"
                  disabled={s.busy || busy}
                  onClick={() => void s.open(session.id, active)}
                >
                  <span>
                    <b>{session.participant.code}</b>
                    <small>
                      {session.task.title[s.language]} ·{" "}
                      {new Date(session.createdAt).toLocaleString(s.language)}
                    </small>
                  </span>
                  <span className="session-action">
                    {active
                      ? t.resume
                      : session.status === "completed"
                        ? t.complete
                        : t.stopped}
                    <ArrowUpRight size={17} />
                  </span>
                </button>
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() => setDeleting(session)}
                >
                  {t.delete}
                </button>
              </article>
            );
          })}
        </div>
      )}
      {deleting && (
        <Modal
          title={t.deleteTitle}
          closeLabel={t.close}
          onClose={busy ? undefined : () => setDeleting(null)}
        >
          <p>{t.deleteBody}</p>
          <div className="actions">
            <button
              disabled={busy}
              className="text-button"
              onClick={() => setDeleting(null)}
            >
              {t.cancel}
            </button>
            <button
              disabled={busy}
              className="primary danger"
              onClick={() => void remove()}
            >
              {t.delete}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
