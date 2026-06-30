import { pct } from "../lib/format.js";

// Kelly position sizing (Pro). Honest framing: full Kelly is growth-optimal but
// dangerous; the report exists to question the edge it assumes.
export default function KellyCard({ data }) {
  if (!data || !data.available) return null;
  const accent = data.positive_edge ? "#58A6FF" : "#E5534B";

  return (
    <div className="card relative overflow-hidden">
      <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: accent }} aria-hidden="true" />
      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="mono-label">Position sizing · Kelly</h3>
          {data.positive_edge ? (
            <span className="rounded-sm border border-data/30 bg-data/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-label text-data">
              {data.full_kelly_leverage.toFixed(1)}× full Kelly
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-overfit/30 bg-overfit/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-label text-overfit">
              <span className="h-1.5 w-1.5 rounded-full bg-overfit" />
              No edge
            </span>
          )}
        </div>

        <p className="mt-2 text-[15px] leading-relaxed text-slate-700 dark:text-txt">
          {data.message}
        </p>

        {data.positive_edge && (
          <>
            <div className="mt-4 overflow-hidden rounded-md border border-slate-200 dark:border-ink-edge">
              <table className="w-full text-left font-mono text-xs tabular-nums">
                <thead>
                  <tr className="border-b border-slate-200 text-txt-muted dark:border-ink-edge">
                    <th className="px-3 py-1.5 font-medium uppercase tracking-label">Sizing</th>
                    <th className="px-3 py-1.5 font-medium uppercase tracking-label">Leverage</th>
                    <th className="px-3 py-1.5 font-medium uppercase tracking-label">Ann. volatility</th>
                  </tr>
                </thead>
                <tbody>
                  {data.levels.map((lv) => {
                    const isQuarter = lv.name === "Quarter";
                    return (
                      <tr
                        key={lv.name}
                        className={`border-b border-slate-100 last:border-0 dark:border-ink-edge/60 ${
                          isQuarter ? "bg-data/5" : ""
                        }`}
                      >
                        <td className="px-3 py-1.5 text-slate-700 dark:text-txt">
                          {lv.name} Kelly
                          {isQuarter && (
                            <span className="ml-2 rounded-sm bg-data/15 px-1.5 py-0.5 text-[9px] uppercase tracking-label text-data">
                              common
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-1.5 font-semibold text-slate-900 dark:text-txt">
                          {lv.leverage.toFixed(2)}×
                        </td>
                        <td className="px-3 py-1.5 text-slate-700 dark:text-txt">{pct(lv.annual_volatility, 0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-label text-txt-faint">
              Leverage = multiple of your tested bet size · assumes the edge is real and constant
            </p>
          </>
        )}
      </div>
    </div>
  );
}
