import { pct } from "../lib/format.js";

const ACCENT = { pass: "#3FB68B", warn: "#D9A441", fail: "#E5534B", info: "#8B97A6" };
const STATUS_TEXT = { pass: "text-robust", warn: "text-caution", fail: "text-overfit", info: "text-txt-muted" };
const STATUS_LABEL = { pass: "Resilient", warn: "Caution", fail: "Fragile", info: "N/A" };

// Missed-trade (skip-trades) robustness (Pro). How often the edge survives when
// a random fraction of trades go missing.
export default function SkipTradesCard({ data }) {
  if (!data || !data.available) return null;
  const accent = ACCENT[data.status] || ACCENT.info;
  const unit = data.unit || "trades";

  return (
    <div className="card relative overflow-hidden">
      <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: accent }} aria-hidden="true" />
      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="mono-label">Missed-trade robustness</h3>
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-label dark:border-ink-edge dark:bg-ink-elevated">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
            <span className={STATUS_TEXT[data.status]}>{STATUS_LABEL[data.status]}</span>
          </span>
        </div>

        <p className="mt-2 text-[15px] leading-relaxed text-slate-700 dark:text-txt">{data.message}</p>

        <div className="mt-4 overflow-hidden rounded-md border border-slate-200 dark:border-ink-edge">
          <table className="w-full text-left font-mono text-xs tabular-nums">
            <thead>
              <tr className="border-b border-slate-200 text-txt-muted dark:border-ink-edge">
                <th className="px-3 py-1.5 font-medium uppercase tracking-label">Skip random</th>
                <th className="px-3 py-1.5 font-medium uppercase tracking-label">Stays profitable</th>
                <th className="px-3 py-1.5 font-medium uppercase tracking-label">Median return</th>
              </tr>
            </thead>
            <tbody>
              {data.levels.map((lv) => {
                const tone = lv.prob_profitable >= 0.9 ? "#3FB68B" : lv.prob_profitable >= 0.5 ? "#D9A441" : "#E5534B";
                return (
                  <tr key={lv.skip} className="border-b border-slate-100 last:border-0 dark:border-ink-edge/60">
                    <td className="px-3 py-1.5 text-slate-700 dark:text-txt">{pct(lv.skip, 0)} of {unit}</td>
                    <td className="px-3 py-1.5 font-semibold" style={{ color: tone }}>{pct(lv.prob_profitable, 0)}</td>
                    <td className="px-3 py-1.5 text-slate-700 dark:text-txt">{pct(lv.median_return)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-label text-txt-faint">
          {data.n_sims.toLocaleString()} simulations · trades dropped at random
        </p>
      </div>
    </div>
  );
}
