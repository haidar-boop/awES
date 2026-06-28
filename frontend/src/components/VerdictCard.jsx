import { VERDICT_META } from "../lib/format.js";

export default function VerdictCard({ verdict }) {
  const meta = VERDICT_META[verdict.level] || VERDICT_META.yellow;
  return (
    <div className={`card overflow-hidden border-2 ${meta.soft}`}>
      <div className={`${meta.bg} px-6 py-5 text-white`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{meta.emoji}</span>
          <div>
            <h2 className="text-2xl font-extrabold leading-tight sm:text-3xl">
              {verdict.headline}
            </h2>
            <p className="text-sm font-medium opacity-90">
              Verdict: {meta.label}
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-4 px-6 py-5">
        <p className="text-base text-slate-700 dark:text-slate-200">
          {verdict.summary}
        </p>

        {verdict.top_reasons?.length > 0 && (
          <div>
            <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-500">
              Why
            </h3>
            <ul className="space-y-1">
              {verdict.top_reasons.map((r, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className={meta.text}>›</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {verdict.warnings?.length > 0 && (
          <div>
            <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-500">
              Warnings
            </h3>
            <ul className="space-y-1">
              {verdict.warnings.map((w, i) => (
                <li key={i} className="flex gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <span>⚠</span>
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
