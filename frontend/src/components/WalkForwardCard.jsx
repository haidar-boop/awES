import { num, pct } from "../lib/format.js";

const ACCENT = { pass: "#3FB68B", warn: "#D9A441", fail: "#E5534B", info: "#8B97A6" };
const STATUS_TEXT = { pass: "text-robust", warn: "text-caution", fail: "text-overfit", info: "text-txt-muted" };
const STATUS_LABEL = { pass: "Consistent", warn: "Uneven", fail: "Decays", info: "N/A" };

// Walk-forward (rolling out-of-sample) consistency (free). Each window's
// annualized Sharpe shown as a centered bar: green above the line, red below.
export default function WalkForwardCard({ data }) {
  if (!data || !data.available) return null;
  const accent = ACCENT[data.status] || ACCENT.info;
  const maxAbs = Math.max(0.01, ...data.folds.map((f) => Math.abs(f.sharpe)));

  return (
    <div className="card relative overflow-hidden">
      <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: accent }} aria-hidden="true" />
      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="mono-label">Walk-forward consistency</h3>
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-label dark:border-ink-edge dark:bg-ink-elevated">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
            <span className={STATUS_TEXT[data.status]}>{STATUS_LABEL[data.status]}</span>
          </span>
        </div>

        <p className="mt-2 text-[15px] leading-relaxed text-slate-700 dark:text-txt">{data.message}</p>

        {/* per-window Sharpe bars */}
        <div className="mt-4">
          <div className="flex items-stretch gap-1.5" style={{ height: "96px" }}>
            {data.folds.map((f) => {
              const h = Math.min(100, (Math.abs(f.sharpe) / maxAbs) * 100);
              const up = f.sharpe >= 0;
              return (
                <div key={f.index} className="flex flex-1 flex-col" title={`Window ${f.index}: Sharpe ${num(f.sharpe)}, return ${pct(f.return)}`}>
                  <div className="flex flex-1 items-end">
                    {up && <div className="w-full rounded-t-sm" style={{ height: `${h}%`, backgroundColor: ACCENT.pass }} />}
                  </div>
                  <div className="h-px bg-slate-300 dark:bg-ink-edge" />
                  <div className="flex flex-1 items-start">
                    {!up && <div className="w-full rounded-b-sm" style={{ height: `${h}%`, backgroundColor: ACCENT.fail }} />}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-1 flex gap-1.5">
            {data.folds.map((f) => (
              <div key={f.index} className="flex-1 text-center font-mono text-[10px] uppercase tracking-label text-txt-faint">
                W{f.index}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-3">
          <Tile label="Windows profitable" value={`${data.positive_folds}/${data.n_folds}`} />
          <Tile label="Early Sharpe" value={num(data.early_sharpe)} />
          <Tile label="Late Sharpe" value={num(data.late_sharpe)} color={data.degrading ? "#E5534B" : null} />
        </div>

        <p className="mt-2 font-mono text-[10px] uppercase tracking-label text-txt-faint">
          Track record split into {data.n_folds} consecutive windows · annualized Sharpe each
        </p>
      </div>
    </div>
  );
}

function Tile({ label, value, color }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-ink-edge dark:bg-ink-elevated">
      <div className="mono-label">{label}</div>
      <div
        className="mt-1 font-mono text-base font-semibold tabular-nums text-slate-900 dark:text-txt"
        style={color ? { color } : undefined}
      >
        {value}
      </div>
    </div>
  );
}
