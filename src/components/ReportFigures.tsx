import { DECKS } from "../domain/types";
import type { Language, ScoreSegment, SessionRecord } from "../domain/types";
import type { SessionAnalysis } from "../domain/analysis";
import { text, percent, number, interpolate } from "../i18n";
import { BlockChart } from "./Charts";

export function Composition({
  row,
  language,
}: {
  row: ScoreSegment;
  language: Language;
}) {
  const t = text(language);
  return (
    <div className="composition-row">
      <div
        className="composition-track"
        role="img"
        aria-label={`${t.composition}: ${DECKS.map((d) => `${d} ${row.counts[d]}`).join(", ")}`}
      >
        {row.count ? (
          DECKS.filter((d) => row.counts[d]).map((d) => (
            <span
              key={d}
              className={`deck-tone deck-${d}`}
              style={{ width: `${(row.counts[d] / row.count) * 100}%` }}
            >
              {row.counts[d] / row.count >= 0.12 ? `${d} ${row.counts[d]}` : ""}
            </span>
          ))
        ) : (
          <span className="composition-empty">{t.noChoices}</span>
        )}
      </div>
      <p className="composition-counts">
        {DECKS.map((d) => (
          <span key={d}>
            {d} <b>{row.counts[d]}</b>
          </span>
        ))}
      </p>
    </div>
  );
}

export function Learning({
  data,
  language,
}: {
  data: SessionAnalysis;
  language: Language;
}) {
  const t = text(language),
    { core } = data;
  return (
    <section className="report-section">
      <h2>{t.learning}</h2>
      <div className="half-comparison">
        {([core.firstHalf, core.secondHalf] as const).map((row, i) => (
          <div key={i}>
            <h3>
              {i ? t.secondHalf : t.firstHalf}{" "}
              <small>
                {row.from}–{row.to}
              </small>
            </h3>
            <strong className="half-rate">
              {percent(
                i
                  ? core.secondHalfAdvantageousRate
                  : core.firstHalfAdvantageousRate,
                language,
              )}
            </strong>
            <p className="report-note">
              {t.advantageousChoices} · {t.score}{" "}
              {row.count ? `${row.score > 0 ? "+" : ""}${row.score}` : "—"}
            </p>
            <Composition row={row} language={language} />
          </div>
        ))}
      </div>
      <p className="learning-change">
        {t.learningDelta}{" "}
        <b>
          {core.learningDelta === null
            ? "—"
            : `${core.learningDelta > 0 ? "+" : ""}${number(core.learningDelta * 100, language)} ${t.percentagePoints}`}
        </b>
      </p>
      {data.stages.map((stage) => (
        <div className="learning-stage" key={stage.stage}>
          {data.stages.length > 1 && (
            <h3>
              {t.stage} {stage.stage}
            </h3>
          )}
          <h3>{t.blockScore}</h3>
          <BlockChart blocks={stage.blocks} t={t} />
          <h3>{t.composition}</h3>
          <div className="block-composition">
            {stage.blocks.map((block) => (
              <div className="block-composition-row" key={block.from}>
                <span>
                  {block.from}–{block.to}
                  {block.count > 0 && block.count < block.to - block.from + 1
                    ? ` · ${t.partial}`
                    : ""}
                </span>
                <Composition row={block} language={language} />
                <strong>
                  {percent(
                    block.advantageousPercent === null
                      ? null
                      : block.advantageousPercent / 100,
                    language,
                  )}
                  <small>C+D</small>
                </strong>
              </div>
            ))}
          </div>
        </div>
      ))}
      <p className="report-note">{t.compositionNote}</p>
      {data.sequence.sustainedAdvantageousOnset !== null && (
        <p className="onset-note">
          <b>{t.sustainedOnset}</b>
          <br />
          {interpolate(t.sustainedNote, {
            trial: data.sequence.sustainedAdvantageousOnset,
            count: data.sequence.sustainedAdvantageousCount,
          })}
        </p>
      )}
    </section>
  );
}

function PreferenceScale({
  label,
  left,
  right,
  rate,
  count,
  language,
}: {
  label: string;
  left: string;
  right: string;
  rate: number | null;
  count: number;
  language: Language;
}) {
  const t = text(language);
  return (
    <figure className="preference-scale">
      <figcaption>
        {label}
        <small>n = {count}</small>
      </figcaption>
      <div className="preference-ends">
        <b>
          {left} {percent(rate, language)}
        </b>
        <b>
          {right} {percent(rate === null ? null : 1 - rate, language)}
        </b>
      </div>
      <div
        className="preference-line"
        role="img"
        aria-label={`${label}: ${left} ${percent(rate, language)}, ${right} ${percent(rate === null ? null : 1 - rate, language)}`}
      >
        <span className="preference-midpoint" />
        {rate !== null && (
          <span
            className="preference-position"
            style={{ left: `${(1 - rate) * 100}%` }}
          />
        )}
      </div>
      <div className="preference-ends report-note">
        <span>{t.frequent}</span>
        <span>{t.infrequent}</span>
      </div>
    </figure>
  );
}
export function ChoiceProfile({
  data,
  language,
}: {
  data: SessionAnalysis;
  language: Language;
}) {
  const t = text(language),
    c = data.deckCounts,
    p = data.choiceProfile;
  return (
    <section className="report-section">
      <h2>{t.choiceProfile}</h2>
      <PreferenceScale
        label={t.disadvantageousPair}
        left="A"
        right="B"
        rate={p.disadvantageousFrequentPreference}
        count={c.A + c.B}
        language={language}
      />
      <PreferenceScale
        label={t.advantageousPair}
        left="C"
        right="D"
        rate={p.advantageousFrequentPreference}
        count={c.C + c.D}
        language={language}
      />
      <div className="overall-frequency">
        <span>{t.overallFrequency}</span>
        <b>
          A+C {percent(p.overallFrequentPreference, language)} <span>↔</span>{" "}
          B+D{" "}
          {percent(
            p.overallFrequentPreference === null
              ? null
              : 1 - p.overallFrequentPreference,
            language,
          )}
        </b>
      </div>
      <p className="report-note">{t.structureNote}</p>
    </section>
  );
}

export function ChoiceSequence({
  record,
  language,
}: {
  record: SessionRecord;
  language: Language;
}) {
  const t = text(language);
  return (
    <section className="report-section">
      <h2>{t.sequence}</h2>
      <div
        className="choice-raster"
        role="img"
        aria-label={`${t.sequence}. ${t.sequenceNote} ${[...record.trials]
          .sort((a, b) => a.sequence - b.sequence)
          .map(
            (row) =>
              `${row.sequence}: ${row.deck}${row.loss > 0 ? `, ${t.loss} ${row.loss}` : ""}`,
          )
          .join("; ")}`}
      >
        {[...record.trials]
          .sort((a, b) => a.sequence - b.sequence)
          .map((row) => (
            <div
              className={`raster-cell deck-tone deck-${row.deck}${row.loss > 0 ? " has-punishment" : ""}`}
              key={row.id}
            >
              <small>{row.sequence}</small>
              <b>{row.deck}</b>
            </div>
          ))}
      </div>
      <p className="report-note">
        {record.trials.length ? t.sequenceNote : t.noChoices}
      </p>
    </section>
  );
}
