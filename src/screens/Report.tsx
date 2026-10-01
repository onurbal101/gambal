import { useEffect, useMemo } from "react";
import { useApp } from "../state/store";
import { text, number, percent } from "../i18n";
import { analyzeSession } from "../domain/analysis";
import { behavioralSummary } from "../domain/summary";
import {
  Learning,
  ChoiceProfile,
  ChoiceSequence,
} from "../components/ReportFigures";
import {
  DeckProfile,
  FeedbackAnalysis,
  DataQuality,
  AnalysisMethod,
} from "../components/ReportAnalysis";
import { download, encodeBackup, trialsCsv } from "../storage/backup";
import { BalanceChart } from "../components/Charts";
export function Report() {
  const s = useApp(),
    r = s.record!,
    session = r.session,
    t = text(s.language),
    data = useMemo(() => analyzeSession(r), [r]);
  useEffect(() => {
    let disclosures: [HTMLDetailsElement, boolean][] = [];
    const prepare = () => {
      if (disclosures.length) return;
      disclosures = Array.from(
        document.querySelectorAll<HTMLDetailsElement>(".results details"),
        (node) => [node, node.open],
      );
      disclosures.forEach(([node]) => {
        node.open = true;
      });
    };
    const restore = () => {
      disclosures.forEach(([node, open]) => {
        node.open = open;
      });
      disclosures = [];
    };
    window.addEventListener("beforeprint", prepare);
    window.addEventListener("afterprint", restore);
    return () => {
      restore();
      window.removeEventListener("beforeprint", prepare);
      window.removeEventListener("afterprint", restore);
    };
  }, []);
  return (
    <section className="results" lang={s.language}>
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
          <strong>
            {percent(data.core.advantageousChoiceRate, s.language)}
          </strong>
          <span>{t.advantageousChoices}</span>
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
      <div className="behavioral-summary">
        <p>{behavioralSummary(data, s.language)}</p>
        <p className="report-note">{t.summaryScope}</p>
      </div>
      <Learning data={data} language={s.language} />
      <ChoiceProfile data={data} language={s.language} />
      <section className="report-section">
        <h2>{t.balanceChart}</h2>
        <BalanceChart record={r} t={t} analysis={data} language={s.language} />
        <div className="totals">
          <span>
            {t.gain} <b>${number(data.total.gains, s.language)}</b>
          </span>
          <span>
            {t.loss} <b>${number(data.total.losses, s.language)}</b>
          </span>
        </div>
      </section>
      <DeckProfile data={data} language={s.language} />
      <FeedbackAnalysis data={data} language={s.language} />
      <ChoiceSequence record={r} language={s.language} />
      <DataQuality data={data} language={s.language} />
      <AnalysisMethod data={data} language={s.language} />
      {data.stages.map((stage) => (
        <div key={stage.stage} className="report-detail">
          <details>
            <summary>
              {t.blockDetails}
              {data.stages.length > 1 ? ` · ${t.stage} ${stage.stage}` : ""}
            </summary>
            <div className="table-wrap">
              <table>
                <caption className="sr">{t.blockDetails}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t.segment}</th>
                    <th scope="col">{t.choices}</th>
                    <th scope="col">{t.score}</th>
                    <th scope="col">{t.rescaled}</th>
                    <th scope="col">{t.advantageous}</th>
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
        </div>
      ))}
      <details className="report-detail">
        <summary>{t.log}</summary>
        <div className="table-wrap">
          <table>
            <caption className="sr">{t.log}</caption>
            <thead>
              <tr>
                <th scope="col">{t.trial}</th>
                <th scope="col">{t.stage}</th>
                <th scope="col">{t.card}</th>
                <th scope="col">{t.gain}</th>
                <th scope="col">{t.loss}</th>
                <th scope="col">{t.balance}</th>
                <th scope="col">{t.response}</th>
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
              JSON.stringify(
                {
                  format: "gambal-analysis",
                  version: data.version,
                  analysis: data,
                },
                null,
                2,
              ),
              `gambal-${session.id}-analysis.json`,
              "application/json",
            )
          }
        >
          {t.downloadAnalysis}
        </button>
        <button className="text-button" onClick={() => window.print()}>
          {t.printReport}
        </button>
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
