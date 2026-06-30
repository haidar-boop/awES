import { pct } from "../lib/format.js";

// Color a cell by its return: green for gains, red for losses, intensity by
// magnitude relative to the largest move. null cells (padding) stay empty.
function cellStyle(v, maxAbs) {
  if (v === null || v === undefined) {
    return { backgroundColor: "transparent" };
  }
  const intensity = maxAbs > 0 ? Math.min(1, Math.abs(v) / maxAbs) : 0;
  const alpha = 0.15 + 0.8 * intensity;
  const rgb = v >= 0 ? "63, 182, 139" : "229, 83, 75"; // robust / overfit
  return { backgroundColor: `rgba(${rgb}, ${alpha})` };
}

// Returns-over-time heatmap (free). Shows whether the edge is spread across
// time or carried by a few hot stretches.
export default function ReturnsHeatmap({ data }) {
  if (!data || !data.available) return null;
  const { rows, cols, unit, positive_share, best, worst, max_abs } = data;
  const unitWord = unit === "month" ? "months" : "periods";

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display font-semibold tracking-tight text-slate-900 dark:text-txt">
          Returns over time
        </h3>
        <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-txt-muted">
          {pct(positive_share, 0)} of {unitWord} positive
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-txt-muted">
        Each cell is the compounded return of one {unit}, grouped sequentially
        from your series. Even color = a steady edge; one or two bright cells =
        the result leans on a few stretches.
      </p>

      <div className="mt-4 space-y-1.5">
        {rows.map((row, ri) => (
          <div key={ri} className="flex items-center gap-2">
            <span className="w-12 shrink-0 text-right font-mono text-[10px] uppercase tracking-label text-txt-faint">
              {row.label}
            </span>
            <div
              className="grid flex-1 gap-1"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {row.cells.map((v, ci) => (
                <div
                  key={ci}
                  className="h-6 rounded-sm border border-slate-200/40 dark:border-ink-edge/60"
                  style={cellStyle(v, max_abs)}
                  title={v === null ? "" : pct(v, 1)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* legend */}
      <div className="mt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-label text-txt-faint">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "rgba(229,83,75,0.85)" }} />
          Worst {pct(worst, 1)}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-3 rounded-sm" style={{ backgroundColor: "rgba(229,83,75,0.35)" }} />
          <span className="h-2.5 w-3 rounded-sm bg-slate-200 dark:bg-ink-elevated" />
          <span className="h-2.5 w-3 rounded-sm" style={{ backgroundColor: "rgba(63,182,139,0.35)" }} />
        </span>
        <span className="flex items-center gap-1.5">
          Best {pct(best, 1)}
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "rgba(63,182,139,0.85)" }} />
        </span>
      </div>
    </div>
  );
}
