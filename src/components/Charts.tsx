import type { Copy } from "../i18n";
import type { SessionRecord, ScoreSegment } from "../domain/types";
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
              <span className="block-value">{b.count ? b.score : "—"}</span>
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
}: {
  record: SessionRecord;
  t: Copy;
}) {
  const startingBalance = record.session.task.procedure.startingBalance;
  const points = [startingBalance, ...record.trials.map((t) => t.balance)];
  const low = Math.min(...points),
    high = Math.max(...points),
    range = Math.max(100, high - low);
  const width = 640,
    height = 155;
  const y = (balance: number) => 20 + ((high - balance) / range) * 110;
  const startingY = y(startingBalance);
  const axisTicks = [high, high - range].filter(
    (balance) => Math.abs(y(balance) - startingY) >= 22,
  );
  const coords = points
    .map(
      (p, i) =>
        `${64 + (i / Math.max(1, points.length - 1)) * (width - 84)},${y(p)}`,
    )
    .join(" ");
  return (
    <svg
      className="balance-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${t.balanceChart}: ${points[0]} → ${points.at(-1)}`}
    >
      <line x1="64" x2="620" y1="130" y2="130" className="chart-rule" />
      {axisTicks.map((balance) => (
        <text
          key={balance}
          x="54"
          y={y(balance)}
          textAnchor="end"
          dominantBaseline="middle"
        >
          {balance}
        </text>
      ))}
      <line
        x1="64"
        x2="620"
        y1={startingY}
        y2={startingY}
        className="starting-balance-line"
        strokeDasharray="6 5"
      />
      <text
        x="54"
        y={startingY}
        textAnchor="end"
        dominantBaseline="middle"
        className="starting-balance-label"
      >
        {startingBalance}
      </text>
      <polyline
        points={coords}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      {points.length === 1 && (
        <circle cx="64" cy="20" r="3" fill="currentColor" />
      )}
      <text x="64" y="152">
        0
      </text>
      <text x="620" y="152" textAnchor="end">
        {record.trials.length}
      </text>
    </svg>
  );
}
