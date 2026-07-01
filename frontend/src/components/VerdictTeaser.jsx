import { Link } from "react-router-dom";
import VerdictCard from "./VerdictCard.jsx";
import { int } from "../lib/format.js";

const PRO_INCLUDES = [
  "A prioritized Validation Plan — exact next steps for your strategy",
  "Every metric & chart — returns, Sharpe, drawdown, PSR + explanations",
  "Deflated Sharpe, PBO, walk-forward & Vs.-Random overfitting tests",
  "Monte Carlo, risk of ruin & missed-trade robustness",
  "Trade-dependency, drawdown recovery & returns heatmap",
  "Compare & combine strategies, Kelly sizing, AI review & the PDF",
];

// The only thing a non-Pro user sees after running their own analysis: the
// headline verdict, then a wall. Everything else is Pro.
export default function VerdictTeaser({ verdict, meta, onUnlock, onNew }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-txt">
            Reality Check Report
          </h1>
          {meta && (
            <p className="mt-0.5 font-mono text-xs tabular-nums text-slate-500 dark:text-txt-muted">
              {int(meta.n_observations)} observations · {meta.frequency} ·{" "}
              {int(meta.num_trials)} trial(s) tested
            </p>
          )}
        </div>
        <button className="btn-ghost" onClick={onNew}>New analysis</button>
      </div>

      <VerdictCard verdict={verdict} />

      {/* the wall */}
      <div className="card relative overflow-hidden border border-data/30">
        <span className="absolute inset-y-0 left-0 w-1 bg-data" aria-hidden="true" />
        <div className="px-6 py-6">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="4.5" y="10.5" width="15" height="9.5" rx="1.6" stroke="#58A6FF" strokeWidth="1.7" />
              <path d="M8 10.5V7.5a4 4 0 018 0v3" stroke="#58A6FF" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            <h2 className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-txt">
              The full report is Pro
            </h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-txt-muted">
            You’re seeing the headline verdict. The complete diagnostic — every
            statistic, chart, and robustness test that produced it — is part of
            TrueSharpe Pro.
          </p>

          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {PRO_INCLUDES.map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-txt">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="mt-0.5 shrink-0">
                  <path d="M2.5 7.5l3 3 6-7" stroke="#3FB68B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button className="btn-primary" onClick={onUnlock}>Unlock full report</button>
            <Link to="/pro" className="btn-ghost">See everything in Pro →</Link>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500 dark:text-txt-faint">{verdict.disclaimer}</p>
    </div>
  );
}
