import { pct } from "../lib/format.js";

const ACCENT = { pass: "#3FB68B", warn: "#D9A441", fail: "#E5534B", info: "#8B97A6" };
const STATUS_TEXT = {
  pass: "text-robust",
  warn: "text-caution",
  fail: "text-overfit",
  info: "text-txt-muted",
};
const STATUS_LABEL = { pass: "Spread", warn: "Concentrated", fail: "Fragile", info: "N/A" };

// Trade-dependency / outlier-concentration test. Free: a core honesty hook.
export default function TradeDependencyCard({ data }) {
  if (!data) return null;
  const accent = ACCENT[data.status] || ACCENT.info;
  const unit = data.unit || "trades";

  return (
    <div className="card relative overflow-hidden">
      <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: accent }} aria-hidden="true" />
      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="mono-label">Trade dependency</h3>
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-label dark:border-ink-edge dark:bg-ink-elevated">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
            <span className={STATUS_TEXT[data.status]}>{STATUS_LABEL[data.status]}</span>
          </span>
        </div>

        <p className="mt-2 text-[15px] leading-relaxed text-slate-700 dark:text-txt">
          {data.message}
        </p>

        {data.applicable && (
          <>
            {/* headline numbers */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-ink-edge dark:bg-ink-elevated">
                <div className="mono-label">
                  Top {data.headline_k} {unit} = share of profit
                </div>
                <div className="mt-1 font-mono text-xl font-semibold tabular-nums" style={{ color: accent }}>
                  {pct(data.profit_share_top, 0)}
                </div>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-ink-edge dark:bg-ink-elevated">
                <div className="mono-label">Total return without them</div>
                <div className="mt-1 flex items-baseline gap-2 font-mono tabular-nums">
                  <span className="text-sm text-slate-400 line-through dark:text-txt-faint">
                    {pct(data.total_return, 0)}
                  </span>
                  <span className="text-xl font-semibold" style={{ color: data.survives ? "#3FB68B" : "#E5534B" }}>
                    {pct(data.total_return_without, 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* per-level breakdown */}
            {data.levels?.length > 1 && (
              <div className="mt-3 overflow-hidden rounded-md border border-slate-200 dark:border-ink-edge">
                <table className="w-full text-left font-mono text-xs tabular-nums">
                  <thead>
                    <tr className="border-b border-slate-200 text-txt-muted dark:border-ink-edge">
                      <th className="px-3 py-1.5 font-medium uppercase tracking-label">Remove top</th>
                      <th className="px-3 py-1.5 font-medium uppercase tracking-label">% of profit</th>
                      <th className="px-3 py-1.5 font-medium uppercase tracking-label">Net after</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.levels.map((lv) => (
                      <tr key={lv.k} className="border-b border-slate-100 last:border-0 dark:border-ink-edge/60">
                        <td className="px-3 py-1.5 text-slate-700 dark:text-txt">
                          {lv.k === 1 ? `best ${unit.replace(/s$/, "")}` : `${lv.k} ${unit}`}
                        </td>
                        <td className="px-3 py-1.5 text-slate-700 dark:text-txt">{pct(lv.profit_share, 0)}</td>
                        <td className="px-3 py-1.5 font-semibold" style={{ color: lv.survives ? "#3FB68B" : "#E5534B" }}>
                          {pct(lv.total_return_without, 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
