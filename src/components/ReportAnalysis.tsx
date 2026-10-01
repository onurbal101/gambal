// biome-ignore-all lint/a11y/noNoninteractiveTabindex: Scrollable data tables must be reachable for keyboard scrolling.
import type { ReactNode } from "react";
import type { SessionAnalysis } from "../domain/analysis";
import { DECKS, type Language } from "../domain/types";
import { text, number, percent, interpolate } from "../i18n";

function DefinitionList({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="analysis-list">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DeckProfile({
  data,
  language,
}: {
  data: SessionAnalysis;
  language: Language;
}) {
  const t = text(language),
    money = (n: number | null) =>
      n === null
        ? "—"
        : `${n > 0 ? "+" : n < 0 ? "−" : ""}$${number(Math.abs(n), language)}`;
  return (
    <section className="report-section">
      <h2>{t.deckProfile}</h2>
      <p className="report-note">{t.observedNote}</p>
      <section className="table-wrap" tabIndex={0} aria-label={t.deckProfile}>
        <table className="deck-profile-table">
          <caption className="sr">{t.observedNote}</caption>
          <thead>
            <tr>
              {[t.card, t.choices, t.gain, t.loss, t.observedNet].map(
                (label) => (
                  <th scope="col" key={label}>
                    {label}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {DECKS.map((deck) => {
              const row = data.deckOutcomes[deck];
              return (
                <tr key={deck}>
                  <th scope="row">{deck}</th>
                  <td>
                    {row.choices}
                    <small>{percent(row.choiceRate, language)}</small>
                  </td>
                  <td>${number(row.grossGain, language)}</td>
                  <td>${number(row.losses, language)}</td>
                  <td>
                    <b>{money(row.netOutcome)}</b>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      <details className="report-subdetail">
        <summary>{t.deckOutcomeDetails}</summary>
        <section
          className="table-wrap"
          tabIndex={0}
          aria-label={t.deckOutcomeDetails}
        >
          <table>
            <caption className="sr">{t.deckOutcomeDetails}</caption>
            <thead>
              <tr>
                {[
                  t.card,
                  t.choicePercent,
                  t.averageNet,
                  t.punishmentEvents,
                  t.punishmentRate,
                  t.largestLoss,
                ].map((label) => (
                  <th scope="col" key={label}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DECKS.map((deck) => {
                const row = data.deckOutcomes[deck];
                return (
                  <tr key={deck}>
                    <th scope="row">{deck}</th>
                    <td>{percent(row.choiceRate, language)}</td>
                    <td>{money(row.averageNetOutcome)}</td>
                    <td>{row.punishmentEvents}</td>
                    <td>{percent(row.punishmentEventRate, language)}</td>
                    <td>
                      {row.largestPunishment === null
                        ? "—"
                        : `$${number(row.largestPunishment, language)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </details>
    </section>
  );
}

export function FeedbackAnalysis({
  data,
  language,
}: {
  data: SessionAnalysis;
  language: Language;
}) {
  const t = text(language),
    f = data.feedback;
  const transition = (
    rate: number | null,
    events: number,
    eligible: number,
  ) => (
    <>
      {percent(rate, language)}{" "}
      <small>
        ({events}/{eligible})
      </small>
    </>
  );
  return (
    <section className="report-section">
      <h2>{t.feedbackAnalysis}</h2>
      <p className="report-note">{t.exploratory}</p>
      <DefinitionList
        rows={[
          [
            t.punishmentStay,
            transition(
              f.punishmentStayRate,
              f.punishmentStays,
              f.punishmentTransitions,
            ),
          ],
          [
            t.punishmentSwitch,
            transition(
              f.punishmentSwitchRate,
              f.punishmentSwitches,
              f.punishmentTransitions,
            ),
          ],
          [
            t.negativeSwitch,
            transition(
              f.netNegativeSwitchRate,
              f.negativeSwitches,
              f.negativeTransitions,
            ),
          ],
        ]}
      />
      <p className="report-note">{t.feedbackNote}</p>
      {/* biome-ignore lint/a11y/noRedundantRoles: Safari needs explicit list semantics when list-style is none. */}
      <ul className="salient-events" role="list">
        {f.salientPunishmentEvents.map((event) => (
          <li key={event.trial}>
            <div>
              <b>
                {t.trial} {event.trial} · {event.deck}
              </b>{" "}
              <span>−${number(event.loss, language)}</span>
              <span className="event-choices">
                {event.nextChoices.map((deck, i) => (
                  <span key={i}>
                    {" "}
                    → <b>{deck}</b>
                  </span>
                ))}
              </span>
            </div>
            <p className="report-note">
              {event.returnLatency !== null
                ? interpolate(t.returnLatency, { count: event.returnLatency })
                : event.observedFollowingChoices
                  ? interpolate(t.noReturn, {
                      count: event.observedFollowingChoices,
                    })
                  : t.noNextChoice}
            </p>
          </li>
        ))}
      </ul>
      <p className="report-note">
        {f.salientPunishmentEvents.length
          ? interpolate(t.salientNote, {
              count: data.parameters.salientLossCount,
            })
          : t.noLossEvents}
      </p>
    </section>
  );
}

export function DataQuality({
  data,
  language,
}: {
  data: SessionAnalysis;
  language: Language;
}) {
  const t = text(language),
    q = data.quality,
    rt = q.responseTime;
  const ms = (n: number | null) =>
    n === null ? "—" : `${number(n, language)} ms`;
  const check = (valid: boolean) => (valid ? t.consistent : t.inconsistent);
  return (
    <section className="report-section quality-section">
      <h2>{t.dataQuality}</h2>
      <details className="report-subdetail">
        <summary>
          {q.warnings.length ? t.qualityReview : t.qualityClean}
        </summary>
        <ul className="quality-warnings">
          {q.warnings.map((warning) => (
            <li key={warning}>{t[warning]}</li>
          ))}
        </ul>
        <DefinitionList
          rows={[
            [t.medianResponse, ms(rt.median)],
            [t.responseIqr, ms(rt.iqr)],
            [t.quartiles, `${ms(rt.q1)} / ${ms(rt.q3)}`],
            [t.responseRange, `${ms(rt.min)} / ${ms(rt.max)}`],
            [t.fastResponses, rt.fastCount],
            [t.validResponses, rt.count],
            [t.missingResponse, rt.missing],
            [t.interruptions, q.interruptions],
            [t.afterInterruption, q.afterInterruptionCount],
            [t.expectedChoices, `${q.recordedCount} / ${q.expectedCount}`],
            [t.missingTrials, q.missingTrials],
            [t.unobservedTrials, q.unobservedTrials],
            [
              t.malformedValues,
              `${q.malformedTrials} / ${q.malformedResponseTimes}`,
            ],
            [t.balanceCheck, check(q.balanceReconciles)],
            [t.positionCheck, check(q.positionsReconcile)],
            [t.outcomeCheck, check(q.outcomesReconcile)],
            [t.sequenceCheck, check(q.sequenceValid && q.countersReconcile)],
          ]}
        />
        <p className="report-note">
          {interpolate(t.fastNote, { threshold: rt.fastThresholdMs })}{" "}
          {t.rtMethod}
        </p>
        <p className="report-note">{t.qualityNote}</p>
      </details>
    </section>
  );
}

export function AnalysisMethod({
  data,
  language,
}: {
  data: SessionAnalysis;
  language: Language;
}) {
  const t = text(language),
    shift = data.choiceProfile.frequencyContextShift;
  return (
    <details className="report-detail">
      <summary>{t.advancedAnalysis}</summary>
      <p className="report-note">{t.formulas}</p>
      <p className="report-note">{t.slicingNote}</p>
      <DefinitionList
        rows={[
          [
            t.frequencyShift,
            shift === null
              ? "—"
              : `${shift > 0 ? "+" : ""}${number(shift * 100, language)} ${t.percentagePoints}`,
          ],
          [t.longestAdvantageousRun, data.sequence.longestAdvantageousRun],
          [t.longestDeckRun, data.sequence.longestSingleDeckRun],
        ]}
      />
    </details>
  );
}
