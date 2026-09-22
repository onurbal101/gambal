import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useApp } from "../state/store";
import { text } from "../i18n";
import { Modal } from "../components/Modal";
export function Home() {
  const s = useApp(),
    t = text(s.language);
  const [versions, setVersions] = useState(false);
  const task = s.tasks.find((task) => task.id === s.taskId);
  const active = s.sessions.filter(
    (session) => session.status === "active" || session.status === "break",
  );
  const update = (key: string, value: string) =>
    s.configure({
      participant: { ...s.participant, [key]: value || undefined },
    });
  return (
    <section className="home">
      <h1>gambal</h1>
      <div className="emblem" aria-hidden="true">
        {"ABCD".split("").map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="mode">
        {(["self", "research"] as const).map((mode) => (
          <button
            key={mode}
            aria-pressed={s.mode === mode}
            onClick={() => s.configure({ mode })}
          >
            {t[mode]}
          </button>
        ))}
      </div>
      <button className="version" onClick={() => setVersions(true)}>
        <span>{t.version}</span>
        <span>
          {task?.title[s.language]}
          <ChevronDown size={16} />
        </span>
      </button>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void s.navigate("instructions");
        }}
      >
        <div className="field">
          <label htmlFor="participant-code">{t.code}</label>
          <input
            id="participant-code"
            value={s.participant.code}
            required
            maxLength={80}
            onChange={(e) =>
              s.configure({
                participant: { ...s.participant, code: e.target.value },
              })
            }
          />
        </div>
        <details className="more-details">
          <summary>{t.extra}</summary>
          <div className="fields">
            <div className="field">
              <label htmlFor="participant-name">{t.name}</label>
              <input
                id="participant-name"
                value={s.participant.name ?? ""}
                maxLength={200}
                onChange={(e) => update("name", e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="participant-age">{t.age}</label>
              <input
                id="participant-age"
                type="number"
                min="0"
                max="120"
                value={s.participant.age ?? ""}
                onChange={(e) =>
                  s.configure({
                    participant: {
                      ...s.participant,
                      age:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    },
                  })
                }
              />
            </div>
            <div className="field">
              <label htmlFor="participant-sex">{t.sex}</label>
              <select
                id="participant-sex"
                value={s.participant.sex ?? ""}
                onChange={(e) => update("sex", e.target.value)}
              >
                <option value="">{t.unspecified}</option>
                {(["female", "male", "other"] as const).map((v) => (
                  <option key={v} value={v}>
                    {t[v]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="participant-education">{t.education}</label>
              <input
                id="participant-education"
                type="number"
                min="0"
                max="60"
                value={s.participant.education ?? ""}
                onChange={(e) =>
                  s.configure({
                    participant: {
                      ...s.participant,
                      education:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    },
                  })
                }
              />
            </div>
            <div className="field span-two">
              <label htmlFor="researcher">{t.researcher}</label>
              <input
                id="researcher"
                maxLength={500}
                value={s.participant.researcher ?? ""}
                onChange={(e) => update("researcher", e.target.value)}
              />
            </div>
          </div>
        </details>
        <button
          className="primary"
          disabled={!task || s.busy || !s.participant.code.trim()}
        >
          {t.start}
        </button>
      </form>
      {active.length > 0 && (
        <div className="resume-list">
          {active.map((session) => (
            <button
              key={session.id}
              className="resume-row"
              onClick={() => void s.open(session.id, true)}
            >
              <span>{session.participant.code}</span>
              <span>{t.resume}</span>
            </button>
          ))}
        </div>
      )}
      {versions && (
        <Modal
          title={t.version}
          closeLabel={t.close}
          onClose={() => setVersions(false)}
        >
          {s.tasks.map((task) => (
            <button
              key={task.id}
              className="option"
              disabled={task.verification === "unavailable"}
              onClick={() => {
                s.configure({ taskId: task.id });
                setVersions(false);
              }}
            >
              <span>{task.title[s.language]}</span>
              {task.verification === "unavailable" ? (
                <small>{task.reason?.[s.language]}</small>
              ) : task.id === s.taskId ? (
                <Check size={18} />
              ) : null}
            </button>
          ))}
          {task?.verification === "legacy-preserved" && (
            <p className="source-note">{t.legacyNote}</p>
          )}
        </Modal>
      )}
    </section>
  );
}
export function Instructions() {
  const s = useApp(),
    t = text(s.language),
    task = s.tasks.find((t) => t.id === s.taskId);
  return (
    <section className="instructions">
      <h1>{t.help}</h1>
      <p>{task?.instructions[s.language]}</p>
      <div className="actions">
        <button className="text-button" onClick={() => void s.navigate("home")}>
          {t.back}
        </button>
        <button
          className="primary"
          disabled={s.busy}
          onClick={() => void s.start()}
        >
          {t.ready}
        </button>
      </div>
    </section>
  );
}
