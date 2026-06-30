import { pct } from "../lib/format.js";

const ACCENT = { pass: "#3FB68B", warn: "#D9A441", info: "#58A6FF" };
const STATUS_TEXT = { pass: "text-robust", warn: "text-caution", info: "text-data" };
const STATUS_LABEL = { pass: "Shallow", warn: "Underwater", info: "Recovered" };

// Drawdown recovery analytics (free). Elaborates the drawdown chart with how
// long the strategy stayed underwater and whether it climbed back.
export default function DrawdownRecoveryCard({ data }) {
  if (!data || !data.available) return null;
  const accent = ACCENT[data.status] || ACCENT.info;
  const unit = data.unit || "periods";

  return (
    <div className="card relative overflow-hidden">
      <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: accent }} aria-hidden="true" />
      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="mono-label">Drawdown recovery</h3>
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-label dark:border-ink-edge dark:bg-ink-elevated">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
            <span className={STATUS_TEXT[data.status]}>
              {data.currently_underwater ? "Underwater now" : STATUS_LABEL[data.status]}
            </span>
          </span>
        </div>

        <p className="mt-2 text-[15px] leading-relaxed text-slate-700 dark:text-txt">{data.message}</p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile label="Max drawdown" value={pct(data.max_drawdown)} color="#E5534B" />
          <Tile
            label="Recovery time"
            value={data.max_recovered ? `${data.max_recovery} ${unit}` : "Not recovered"}
            color={data.max_recovered ? null : "#E5534B"}
          />
          <Tile label="Time underwater" value={pct(data.time_underwater, 0)} />
          <Tile label={`Longest underwater`} value={`${data.longest_underwater} ${unit}`} />
        </div>

        {data.episodes?.length > 1 && (
          <div className="mt-3 overflow-hidden rounded-md border border-slate-200 dark:border-ink-edge">
            <table className="w-full text-left font-mono text-xs tabular-nums">
              <thead>
                <tr className="border-b border-slate-200 text-txt-muted dark:border-ink-edge">
                  <th className="px-3 py-1.5 font-medium uppercase tracking-label">Worst drawdowns</th>
                  <th className="px-3 py-1.5 font-medium uppercase tracking-label">Underwater</th>
                  <th className="px-3 py-1.5 font-medium uppercase tracking-label">Recovered</th>
                </tr>
              </thead>
              <tbody>
                {data.episodes.map((ep, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0 dark:border-ink-edge/60">
                    <td className="px-3 py-1.5 font-semibold text-overfit">{pct(ep.depth)}</td>
                    <td className="px-3 py-1.5 text-slate-700 dark:text-txt">{ep.underwater} {unit}</td>
                    <td className="px-3 py-1.5" style={{ color: ep.recovered ? "#3FB68B" : "#E5534B" }}>
                      {ep.recovered ? `in ${ep.recovery} ${unit}` : "not yet"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
