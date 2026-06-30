import Tooltip from "./Tooltip.jsx";
import { STATUS_META } from "../lib/format.js";

export default function MetricRow({ row, showPlain = true }) {
  const s = STATUS_META[row.status] || STATUS_META.info;
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-0 dark:border-ink-edge sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0 flex-1">
        <div className="flex items-center">
          <span className="font-semibold text-slate-900 dark:text-txt">{row.label}</span>
          {row.tooltip && <Tooltip text={row.tooltip} />}
        </div>
        {showPlain && (
          <p className="mt-0.5 text-sm text-slate-500 dark:text-txt-muted">
            {row.plain}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3 sm:w-44 sm:justify-end">
        <span className="font-mono text-base font-semibold tabular-nums text-slate-900 dark:text-txt">{row.value}</span>
        <span className="inline-flex items-center gap-1.5 rounded-sm border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-label dark:border-ink-edge dark:bg-ink-elevated">
          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
          <span className={s.text}>{s.label}</span>
        </span>
      </div>
    </div>
  );
}
