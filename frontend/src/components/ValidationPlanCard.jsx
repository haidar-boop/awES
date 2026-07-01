const SEV = {
  critical: { color: "#E5534B", label: "Critical", chip: "bg-overfit/10 text-overfit" },
  important: { color: "#D9A441", label: "Fix", chip: "bg-caution/10 text-caution" },
  minor: { color: "#58A6FF", label: "Note", chip: "bg-data/10 text-data" },
  strength: { color: "#3FB68B", label: "Strength", chip: "bg-robust/10 text-robust" },
};

// Validation plan (Pro): a prioritised action list read off this report.
export default function ValidationPlanCard({ data }) {
  if (!data || !data.available) return null;
  const { critical = 0, important = 0 } = data.counts || {};
  const headline = critical > 0 ? "#E5534B" : important > 0 ? "#D9A441" : "#3FB68B";

  return (
    <div className="card relative overflow-hidden border" style={{ borderColor: headline + "55" }}>
      <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: headline }} aria-hidden="true" />
      <div className="px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-txt">
            Your validation plan
          </h2>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-label">
            {critical > 0 && (
              <span className="rounded-sm bg-overfit/10 px-1.5 py-0.5 font-semibold text-overfit">{critical} critical</span>
            )}
            {important > 0 && (
              <span className="rounded-sm bg-caution/10 px-1.5 py-0.5 font-semibold text-caution">{important} to fix</span>
            )}
          </div>
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-txt-muted">{data.summary}</p>

        <ol className="mt-4 space-y-3">
          {data.items.map((it, i) => {
            const s = SEV[it.severity] || SEV.minor;
            return (
              <li key={i} className="flex gap-3">
                <span
                  className="mt-1 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: s.color }}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-txt">{it.title}</span>
                    <span className={`rounded-sm px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-label ${s.chip}`}>
                      {s.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-600 dark:text-txt-muted">
                    {it.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
