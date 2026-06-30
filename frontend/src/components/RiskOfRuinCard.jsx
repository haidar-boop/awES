import { pct } from "../lib/format.js";

const ACCENT = { pass: "#3FB68B", warn: "#D9A441", fail: "#E5534B", info: "#8B97A6" };
const STATUS_TEXT = {
  pass: "text-robust",
  warn: "text-caution",
  fail: "text-overfit",
  info: "text-txt-muted",
};
const STATUS_LABEL = { pass: "Resilient", warn: "Caution", fail: "At risk", info: "N/A" };

// Risk of ruin, read off the Monte Carlo paths (Pro feature).
export default function RiskOfRuinCard({ data }) {
  if (!data || !data.available) return null;
  const accent = ACCENT[data.status] || ACCENT.info;
  const ruinPct = `${Math.round((data.ruin_level || 0.5) * 100)}%`;

  return (
    <div className="card relative overflow-hidden">
      <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: accent }} aria-hidden="true" />
      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="mono-label">Risk of ruin</h3>
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-label dark:border-ink-edge dark:bg-ink-elevated">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
            <span className={STATUS_TEXT[data.status]}>{STATUS_LABEL[data.status]}</span>
          </span>
        </div>

        <p className="mt-2 text-[15px] leading-relaxed text-slate-700 dark:text-txt">
          {data.message}
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-ink-edge dark:bg-ink-elevated">
            <div className="mono-label">Chance of {ruinPct}+ drawdown</div>
            <div className="mt-1 font-mono text-xl font-semibold tabular-nums" style={{ color: accent }}>
              {pct(data.prob_ruin, 0)}
            </div>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-ink-edge dark:bg-ink-elevated">
            <div className="mono-label">Worst-case drawdown</div>
            <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-overfit">
              {pct(data.worst_case_drawdown, 0)}
            </div>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-ink-edge dark:bg-ink-elevated">
            <div className="mono-label">Chance of a losing run</div>
            <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-slate-900 dark:text-txt">
              {pct(data.prob_loss, 0)}
            </div>
          </div>
        </div>

        {data.levels?.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-md border border-slate-200 dark:border-ink-edge">
            <table className="w-full text-left font-mono text-xs tabular-nums">
              <thead>
                <tr className="border-b border-slate-200 text-txt-muted dark:border-ink-edge">
                  <th className="px-3 py-1.5 font-medium uppercase tracking-label">Drawdown depth</th>
                  <th className="px-3 py-1.5 font-medium uppercase tracking-label">Chance of reaching it</th>
                </tr>
              </thead>
              <tbody>
                {data.levels.map((lv) => (
                  <tr key={lv.level} className="border-b border-slate-100 last:border-0 dark:border-ink-edge/60">
                    <td className="px-3 py-1.5 text-slate-700 dark:text-txt">{pct(lv.level, 0)} or deeper</td>
                    <td className="px-3 py-1.5 font-semibold text-slate-900 dark:text-txt">{pct(lv.prob, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 font-mono text-[10px] uppercase tracking-label text-txt-faint">
          From {data.n_sims.toLocaleString()} Monte Carlo resamples
        </p>
      </div>
    </div>
  );
}
