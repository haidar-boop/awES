import { VERDICT_META } from "../lib/format.js";
import VerdictGauge from "./VerdictGauge.jsx";

export default function VerdictCard({ verdict }) {
  const meta = VERDICT_META[verdict.level] || VERDICT_META.yellow;
  return (
    <div
      className={`card relative overflow-hidden border ${meta.soft} animate-settle`}
    >
      {/* status edge */}
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: meta.accent }}
        aria-hidden="true"
      />
      <div className="flex flex-col gap-5 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-sm px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-label ${meta.chip}`}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.accent }} />
              Verdict · {meta.code}
            </span>
          </div>
          <h2 className="mt-3 font-display text-2xl font-bold leading-tight tracking-tight text-slate-900 dark:text-txt sm:text-3xl">
            {verdict.headline}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-txt-muted">{meta.label}</p>
        </div>
        <div className="shrink-0 self-center">
          <VerdictGauge zone={meta.zone} accent={meta.accent} />
        </div>
      </div>

      <div className="space-y-4 border-t hairline px-6 py-5">
        <p className="text-[15px] leading-relaxed text-slate-700 dark:text-txt">
          {verdict.summary}
        </p>

        {verdict.top_reasons?.length > 0 && (
          <div>
            <h3 className="mono-label mb-2">Why</h3>
            <ul className="space-y-1.5">
              {verdict.top_reasons.map((r, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-slate-700 dark:text-txt">
                  <span className={`mt-px font-mono ${meta.text}`} aria-hidden="true">›</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {verdict.warnings?.length > 0 && (
          <div>
            <h3 className="mono-label mb-2">Warnings</h3>
            <ul className="space-y-1.5">
              {verdict.warnings.map((w, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-caution">
                  <span className="mt-px font-mono" aria-hidden="true">!</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
