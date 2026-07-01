import { num, pct } from "../lib/format.js";

const ACCENT = { pass: "#3FB68B", warn: "#D9A441", fail: "#E5534B", info: "#8B97A6" };
const STATUS_TEXT = { pass: "text-robust", warn: "text-caution", fail: "text-overfit", info: "text-txt-muted" };
const STATUS_LABEL = { pass: "Beats chance", warn: "Borderline", fail: "Looks random", info: "N/A" };

// Vs. Random test (Pro). Where the strategy lands against a field of zero-edge
// random strategies with matched volatility.
export default function VsRandomCard({ data }) {
  if (!data || !data.available) return null;
  const accent = ACCENT[data.status] || ACCENT.info;
  const scale = Math.max(0.01, data.real_sharpe, data.best_random_sharpe);
  const bar = (v) => `${Math.max(0, Math.min(100, (v / scale) * 100))}%`;

  return (
    <div className="card relative overflow-hidden">
      <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: accent }} aria-hidden="true" />
      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="mono-label">Vs. random — could this be luck?</h3>
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-label dark:border-ink-edge dark:bg-ink-elevated">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
            <span className={STATUS_TEXT[data.status]}>{STATUS_LABEL[data.status]}</span>
          </span>
        </div>

        <p className="mt-2 text-[15px] leading-relaxed text-slate-700 dark:text-txt">{data.message}</p>

        {/* your Sharpe vs the luckiest random one */}
        <div className="mt-4 space-y-2">
          <BarRow label="Your Sharpe" value={num(data.real_sharpe)} width={bar(data.real_sharpe)} color={accent} />
          <BarRow label="Luckiest random" value={num(data.best_random_sharpe)} width={bar(data.best_random_sharpe)} color="#8B97A6" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Tile label="Random strategies you beat" value={pct(data.beat_pct, 0)} color={accent} />
          <Tile label="Chance pure luck matches you" value={pct(data.p_value, 1)} color={data.p_value >= 0.25 ? "#E5534B" : null} />
        </div>

        <p className="mt-2 font-mono text-[10px] uppercase tracking-label text-txt-faint">
          Raced against {data.n_random.toLocaleString()} zero-edge random strategies · matched volatility
        </p>
      </div>
    </div>
  );
}

function BarRow({ label, value, width, color }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 font-mono text-[11px] uppercase tracking-label text-txt-muted">{label}</span>
      <div className="h-4 flex-1 overflow-hidden rounded-sm bg-slate-100 dark:bg-ink-elevated">
        <div className="h-full rounded-sm" style={{ width, backgroundColor: color }} />
      </div>
      <span className="w-12 shrink-0 text-right font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-txt">{value}</span>
    </div>
  );
}

function Tile({ label, value, color }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-ink-edge dark:bg-ink-elevated">
      <div className="mono-label">{label}</div>
      <div
        className="mt-1 font-mono text-xl font-semibold tabular-nums text-slate-900 dark:text-txt"
        style={color ? { color } : undefined}
      >
        {value}
      </div>
    </div>
  );
}
