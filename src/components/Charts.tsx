import { useState, useId, type PointerEvent } from "react";
import { number, type Copy } from "../i18n";
import type { Language, SessionRecord, ScoreSegment } from "../domain/types";
import type { SessionAnalysis } from "../domain/analysis";
export function BlockChart({ blocks, t }: { blocks: ScoreSegment[]; t: Copy }) {
  return (
    <div
      className="block-chart"
      role="img"
      aria-label={`${t.blockScore}: ${blocks.map((b) => `${b.from}–${b.to}: ${b.count ? b.score : "—"}`).join(", ")}`}
    >
      <div className="block-axis">
        <span>+20</span>
        <span>0</span>
        <span>−20</span>
      </div>
      <div className="block-columns">
        {blocks.map((b) => (
          <div className="block-column" key={b.from}>
            <div className="block-space">
              <span
                className={`block-bar ${b.score < 0 ? "negative" : ""}`}
                style={{
                  height: `${(Math.abs(b.score) / 40) * 100}%`,
                  bottom:
                    b.score >= 0
                      ? "50%"
                      : `${50 - (Math.abs(b.score) / 40) * 100}%`,
                }}
              />
              <span className="block-value">
                {b.count ? `${b.score > 0 ? "+" : ""}${b.score}` : "—"}
              </span>
            </div>
            <span className="block-label">
              {b.from}–{b.to}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
export function BalanceChart({
  record,
  t,
  analysis,
  language,
}: {
  record: SessionRecord;
  t: Copy;
  analysis: SessionAnalysis;
  language: Language;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const id = useId();
  const rows = [...record.trials].sort((a, b) => a.sequence - b.sequence);
  const startingBalance = record.session.task.procedure.startingBalance;
  const points = [startingBalance, ...rows.map((t) => t.balance)].filter(
    Number.isFinite,
  );
  const low = Math.min(...points),
    high = Math.max(...points),
    range = Math.max(100, high - low);
  const width = 640,
    height = 255;
  const y = (balance: number) => 36 + ((high - balance) / range) * 174;
  const startingY = y(startingBalance);
  const axisTicks = [high, high - range].filter(
    (balance) => Math.abs(y(balance) - startingY) >= 22,
  );
  const x = (i: number) => 76 + (i / Math.max(1, rows.length)) * 544;
  const active = Math.min(selected ?? rows.length, rows.length);
  const row = active > 0 ? rows[active - 1] : null;
  const balance = row?.balance ?? startingBalance;
  const money = (n: number) => `$${number(n, language)}`;
  const inspectPoint = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    if (!box.width) return;
    const svgX = ((event.clientX - box.left) / box.width) * width;
    setSelected(
      Math.max(
        0,
        Math.min(rows.length, Math.round(((svgX - 76) / 544) * rows.length)),
      ),
    );
  };
  const paths: string[] = [];
  let path = `${x(0)},${y(startingBalance)}`;
  rows.forEach((trial, i) => {
    if (
      i > 0 &&
      rows[i - 1].stage !== trial.stage &&
      record.session.task.procedure.resetBetweenStages
    ) {
      paths.push(path);
      path = `${x(i)},${y(startingBalance)}`;
    }
    path += ` ${x(i + 1)},${y(trial.balance)}`;
  });
  paths.push(path);
  return (
    <div className="balance-figure">
      <svg
        className="balance-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${t.balanceChart}: ${points[0]} → ${points.at(-1)}`}
        aria-describedby={`${id}-help`}
        onPointerMove={inspectPoint}
        onPointerDown={inspectPoint}
      >
        <title>{t.balanceChart}</title>
        <line x1="76" x2="620" y1="210" y2="210" className="chart-rule" />
        {axisTicks.map((balance) => (
          <text
            key={balance}
            x="66"
            y={y(balance)}
            textAnchor="end"
            dominantBaseline="middle"
          >
            {number(balance, language)}
          </text>
        ))}
        <line
          x1="76"
          x2="620"
          y1={startingY}
          y2={startingY}
          className="starting-balance-line"
          strokeDasharray="6 5"
        />
        <text
          x="66"
          y={startingY}
          textAnchor="end"
          dominantBaseline="middle"
          className="starting-balance-label"
        >
          {number(startingBalance, language)}
        </text>
        {paths.map((coords, i) => (
          <polyline
            key={i}
            points={coords}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          />
        ))}
        {analysis.feedback.salientPunishmentEvents.map((event) => {
          const i = rows.findIndex((trial) => trial.sequence === event.trial);
          if (i < 0) return null;
          return (
            <g key={event.trial}>
              <circle
                cx={x(i + 1)}
                cy={y(rows[i].balance)}
                r="5"
                className="loss-marker"
              >
                <title>{`${t.trial} ${event.trial} · ${event.deck} · ${t.loss} ${money(event.loss)}`}</title>
              </circle>
            </g>
          );
        })}
        <circle cx={x(active)} cy={y(balance)} r="3" fill="currentColor" />
        {rows.length > 0 && (
          <text
            x="620"
            y={y(rows.at(-1)!.balance) - 12}
            textAnchor="end"
            className="final-balance-label"
          >
            {money(rows.at(-1)!.balance)}
          </text>
        )}
        {points.length === 1 && (
          <circle cx="76" cy={y(startingBalance)} r="3" fill="currentColor" />
        )}
        <text x="76" y="244">
          0
        </text>
        <text x="620" y="244" textAnchor="end">
          {record.trials.length}
        </text>
        <text x="348" y="244" textAnchor="middle">
          {t.trial}
        </text>
      </svg>
      <p id={`${id}-help`} className="report-note">
        {t.chartHelp}
      </p>
      <label className="chart-slider" htmlFor={id}>
        {t.trial} · {row?.sequence ?? 0}
        <input
          id={id}
          type="range"
          min="0"
          max={rows.length}
          value={active}
          disabled={!rows.length}
          aria-valuetext={`${t.trial} ${row?.sequence ?? 0}, ${row?.deck ?? t.startingBalance}, ${row ? `${t.gain} ${money(row.gain)}, ${t.loss} ${money(row.loss)}, ${t.netOutcome} ${money(row.gain - row.loss)}, ` : ""}${t.balance} ${money(balance)}`}
          onChange={(event) => setSelected(Number(event.target.value))}
        />
      </label>
      <dl className="chart-reading">
        {[
          [t.trial, String(row?.sequence ?? 0)],
          [t.card, row?.deck ?? "—"],
          [t.gain, row ? money(row.gain) : "—"],
          [t.loss, row ? money(row.loss) : "—"],
          [t.netOutcome, row ? money(row.gain - row.loss) : "—"],
          [t.balance, money(balance)],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
