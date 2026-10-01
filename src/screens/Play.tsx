import { useEffect, useState } from "react";
import { DECKS } from "../domain/types";
import { useApp } from "../state/store";
import { number, text } from "../i18n";
import { Modal } from "../components/Modal";
import { BalanceOdometer } from "../components/BalanceOdometer";

function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3.5 9.5v5h3.25L11.5 18V6L6.75 9.5H3.5Z" />
      {muted ? (
        <path d="M14.5 17.5 21 6.5" />
      ) : (
        <>
          <path d="M14 10a3 3 0 0 1 0 4" />
          <path d="M16.5 7.5a6.5 6.5 0 0 1 0 9" />
          <path d="M19 5a10 10 0 0 1 0 14" />
        </>
      )}
    </svg>
  );
}

export function Play() {
  const s = useApp(),
    r = s.record!,
    session = r.session,
    t = text(session.language);
  const [dialog, setDialog] = useState<"help" | "end" | null>(null);
  const last = r.trials.at(-1);
  const frozen =
    s.busy ||
    s.feedback ||
    s.paused ||
    !!s.error ||
    !!s.pending ||
    session.status !== "active";
  const close = () => {
    setDialog(null);
  };
  return (
    <section className="play">
      <h1 className="sr">gambal</h1>
      <p className="balance-label">{t.balance}</p>
      <BalanceOdometer
        value={session.balance}
        language={session.language}
      />
      <div
        className={`outcome prominent ${s.feedback ? "revealing" : ""}`}
        key={last?.id ?? "initial"}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="outcome-gain">
          <span>{t.gain}</span>
          <strong>
            {last ? `+$${number(last.gain, session.language)}` : "—"}
          </strong>
        </div>
        <span className="divider" aria-hidden="true" />
        <div className={`outcome-loss ${last?.loss ? "has-loss" : ""}`}>
          <span>{t.loss}</span>
          <strong>
            {last
              ? `${last.loss ? "−" : ""}$${number(last.loss, session.language)}`
              : "—"}
          </strong>
        </div>
      </div>
      <div className="decks">
        {DECKS.map((deck) => {
          const empty =
            session.positions[deck] >= session.task.decks[deck].length;
          return (
            <button
              key={deck}
              type="button"
              className={`deck ${empty ? "empty" : ""} ${s.feedback && last?.deck === deck ? "picked" : ""}`}
              aria-label={`${t.card} ${deck}`}
              disabled={frozen || empty}
              onClick={() => void s.choose(deck)}
              onKeyDown={(e) => {
                if (e.repeat) e.preventDefault();
              }}
            >
              {deck}
            </button>
          );
        })}
      </div>
      <div className="play-footer">
        <button
          className="text-button"
          disabled={s.busy || s.feedback || !!s.pending}
          onClick={() => {
            setDialog("help");
            void s.pause("help");
          }}
        >
          {t.help}
        </button>
        <span aria-hidden="true">·</span>
        <button
          className="text-button"
          disabled={s.busy || s.feedback || !!s.pending}
          onClick={() => {
            setDialog("end");
            void s.pause("help");
          }}
        >
          {t.end}
        </button>
        <button
          type="button"
          className="sound-toggle"
          aria-label={t.soundEffects}
          aria-pressed={!s.soundMuted}
          title={s.soundMuted ? t.enableSound : t.muteSound}
          onClick={s.toggleSound}
        >
          <SoundIcon muted={s.soundMuted} />
        </button>
      </div>
      {dialog && (
        <Modal
          title={dialog === "help" ? t.help : t.finish}
          closeLabel={t.close}
          onClose={close}
        >
          <p>
            {dialog === "help"
              ? session.task.instructions[session.language]
              : t.finishBody}
          </p>
          <button
            className="primary"
            disabled={s.busy}
            onClick={() => {
              setDialog(null);
              if (dialog === "end") void s.stop();
              else void s.resume();
            }}
          >
            {dialog === "help" ? t.continue : t.end}
          </button>
          {dialog === "end" && (
            <button className="text-button" onClick={close}>
              {t.cancel}
            </button>
          )}
        </Modal>
      )}
      {s.paused && !s.error && !dialog && !s.feedback && (
        <Modal title={t.paused} closeLabel={t.close}>
          <p>{t.saved}</p>
          <button
            className="primary"
            disabled={s.busy}
            onClick={() => void s.resume()}
          >
            {t.resume}
          </button>
        </Modal>
      )}
    </section>
  );
}
export function Completion() {
  const s = useApp(),
    r = s.record!,
    t = text(r.session.language);
  return (
    <section className="completion">
      <div className="completion-mark" aria-hidden="true">
        <span>A</span>
        <span>B</span>
        <span>C</span>
        <span>D</span>
      </div>
      <h1>{r.session.status === "completed" ? t.complete : t.stopped}</h1>
      {r.session.mode === "research" && <p>{t.researchReturn}</p>}
      <button className="primary" onClick={() => void s.navigate("report")}>
        {t.review}
      </button>
      <button className="text-button" onClick={() => void s.navigate("home")}>
        {t.home}
      </button>
    </section>
  );
}
export function StageBreak() {
  const s = useApp(),
    r = s.record!,
    t = text(r.session.language),
    [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);
  const remaining = Math.max(
    0,
    Math.ceil((r.session.stageAvailableAt - now) / 1000),
  );
  return (
    <section className="completion">
      <h1>{t.break}</h1>
      <p>{t.breakBody}</p>
      {remaining > 0 && (
        <p>
          {t.remaining}: {remaining}
        </p>
      )}
      <button
        className="primary"
        disabled={remaining > 0 || s.busy || s.paused || !!s.error}
        onClick={() => void s.nextStage()}
      >
        {t.next}
      </button>
      {s.paused && !s.error && (
        <Modal title={t.paused} closeLabel={t.close}>
          <p>{t.saved}</p>
          <button
            className="primary"
            disabled={s.busy}
            onClick={() => void s.resume()}
          >
            {t.resume}
          </button>
        </Modal>
      )}
    </section>
  );
}
