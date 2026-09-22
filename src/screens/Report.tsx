import { useMemo } from "react";
import { useApp } from "../state/store";
import { text, number } from "../i18n";
import { DECKS } from "../domain/types";
import { report } from "../domain/report";
import { download, encodeBackup, trialsCsv } from "../storage/backup";
import { BlockChart, BalanceChart } from "../components/Charts";
export function Report() {
  const s = useApp(),
    r = s.record!,
    session = r.session,
    t = text(s.language),
    data = useMemo(() => report(session, r.trials), [session, r.trials]);
  return (
    <section className="results">
      <div className="report-title">
        <div>
          <h1>{t.results}</h1>
          <p>
            {session.task.title[s.language]} · {session.participant.code} ·{" "}
            {session.status === "completed" ? t.complete : t.stopped}
          </p>
        </div>
        <button
          className="text-button"
          onClick={() => void s.navigate("library")}
        >
          {t.sessions}
        </button>
      </div>
      <div className="metrics">
        <div>
          <strong>{data.total.score}</strong>
          <span>{t.score}</span>
        </div>
        <div>
          <strong>${number(session.balance, s.language)}</strong>
          <span>{t.finalBalance}</span>
        </div>
        <div>
          <strong>{r.trials.length}</strong>
          <span>{t.choices}</span>
        </div>
      </div>
      <div className="report-charts">
        <section className="chart">
          <h2>{t.deckChoices}</h2>
          {DECKS.map((d) => (
            <div className="bar-row" key={d}>
              <span>{d}</span>
              <div className="track">
                <div
                  className="bar"
                  style={{
                    width: `${r.trials.length ? (data.total.counts[d] / r.trials.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <span>{data.total.counts[d]}</span>
            </div>
          ))}
        </section>
        <section className="chart">
          <h2>{t.balanceChart}</h2>
          <BalanceChart record={r} t={t} />
        </section>
      </div>
      {data.stages.map((stage) => (
        <section key={stage.stage} className="stage-report">
          <h2>
            {t.blockScore}
            {data.stages.length > 1 ? ` · ${t.stage} ${stage.stage}` : ""}
          </h2>
          <BlockChart blocks={stage.blocks} t={t} />
          <details>
            <summary>{t.details}</summary>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t.segment}</th>
                    <th>{t.choices}</th>
                    <th>{t.score}</th>
                    <th>{t.rescaled}</th>
                    <th>{t.advantageous}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ...stage.blocks,
                    stage.firstHalf,
                    stage.secondHalf,
                    stage.total,
                  ].map((row, i) => (
                    <tr key={i}>
                      <td>
                        {i < stage.blocks.length
                          ? `${row.from}–${row.to}`
                          : [t.firstHalf, t.secondHalf, t.total][
                              i - stage.blocks.length
                            ]}
                      </td>
                      <td>{row.count}</td>
                      <td>{row.count ? row.score : "—"}</td>
                      <td>
                        {row.rescaledScore === null
                          ? "—"
                          : number(row.rescaledScore, s.language)}
                      </td>
                      <td>
                        {row.advantageousPercent === null
                          ? "—"
                          : number(row.advantageousPercent, s.language)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </section>
      ))}
      <div className="totals">
        <span>
          {t.gain} <b>${number(data.total.gains, s.language)}</b>
        </span>
        <span>
          {t.loss} <b>${number(data.total.losses, s.language)}</b>
        </span>
      </div>
      <details className="report-detail">
        <summary>{t.log}</summary>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t.trial}</th>
                <th>{t.stage}</th>
                <th>{t.card}</th>
                <th>{t.gain}</th>
                <th>{t.loss}</th>
                <th>{t.balance}</th>
                <th>{t.response}</th>
              </tr>
            </thead>
            <tbody>
              {r.trials.map((row) => (
                <tr key={row.id}>
                  <td>{row.sequence}</td>
                  <td>{row.stage}</td>
                  <td>{row.deck}</td>
                  <td>{row.gain}</td>
                  <td>{row.loss}</td>
                  <td>{row.balance}</td>
                  <td>{row.responseTimeMs ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <details className="report-detail">
        <summary>
          {t.interruptions} <span>{r.interruptions.length}</span>
        </summary>
        <ul className="events">
          {r.interruptions.map((e) => (
            <li key={e.id}>
              <span>{e.type === "help" ? t.help : t[e.type]}</span>
              <time>{new Date(e.at).toLocaleString(s.language)}</time>
            </li>
          ))}
        </ul>
      </details>
      <details className="report-detail">
        <summary>{t.details}</summary>
        <dl className="metadata">
          <dt>{t.code}</dt>
          <dd>{session.participant.code}</dd>
          {(["name", "age", "sex", "education", "researcher"] as const)
            .filter((k) => session.participant[k] !== undefined)
            .map((k) => (
              <div className="metadata-row" key={k}>
                <dt>{t[k]}</dt>
                <dd>{String(session.participant[k])}</dd>
              </div>
            ))}
          <dt>{t.date}</dt>
          <dd>{new Date(session.createdAt).toLocaleString(s.language)}</dd>
          <dt>{t.version}</dt>
          <dd>
            {session.task.id} / {session.task.revision}
          </dd>
          <dt>{t.verification}</dt>
          <dd>
            {session.task.verification === "legacy-preserved"
              ? t.legacy
              : t.verified}
          </dd>
          <dt>{t.feedback}</dt>
          <dd>
            {session.task.procedure.feedbackMs ??
              session.task.presentation.feedbackMs}
          </dd>
          <dt>{t.checksum}</dt>
          <dd className="checksum">{session.task.deckChecksum}</dd>
        </dl>
        {session.task.verification === "legacy-preserved" && (
          <p className="source-note">{t.legacyNote}</p>
        )}
        <ul className="sources">
          {session.task.sources.map((source) => (
            <li key={source}>
              {source.startsWith("https://") ? (
                <a href={source} target="_blank" rel="noreferrer">
                  {source}
                </a>
              ) : (
                source
              )}
            </li>
          ))}
        </ul>
      </details>
      <div className="report-bottom">
        <button
          className="text-button"
          onClick={() =>
            download(
              trialsCsv([r]),
              `gambal-${session.id}.csv`,
              "text/csv;charset=utf-8",
            )
          }
        >
          {t.downloadCsv}
        </button>
        <button
          className="text-button"
          onClick={() =>
            download(
              encodeBackup([r]),
              `gambal-${session.id}.json`,
              "application/json",
            )
          }
        >
          {t.downloadJson}
        </button>
      </div>
    </section>
  );
}
