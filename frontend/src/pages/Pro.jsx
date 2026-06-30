import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";

const GROUPS = [
  {
    title: "The full report",
    items: [
      "The complete statistical verdict and every core metric — total return, CAGR, annualized Sharpe, max drawdown, PSR",
      "Equity curve, drawdown, return distribution and rolling-Sharpe charts",
      "Plain-English explanation of every check, beginner to quant",
    ],
  },
  {
    title: "Overfitting & data-mining tests",
    items: [
      "Deflated Sharpe Ratio — adjusts for how many variations you tried",
      "Backtest-overfit probability (PBO)",
      "Out-of-sample degradation & multi-window walk-forward consistency",
    ],
  },
  {
    title: "Simulation & risk",
    items: [
      "Monte Carlo simulation with the outcome cone",
      "Risk of ruin — probability of a deep drawdown across thousands of resamples",
      "Missed-trade robustness — does the edge survive if you skip random trades?",
    ],
  },
  {
    title: "Concentration & drawdowns",
    items: [
      "Trade-dependency — does removing your best trades wipe out the edge?",
      "Drawdown recovery — time underwater and whether it recovered",
      "Returns-over-time heatmap — is the edge steady or lumpy?",
    ],
  },
  {
    title: "Tools & deliverables",
    items: [
      "Kelly position sizing — growth-optimal and safer fractional sizings",
      "Compare two strategies side by side",
      "AI strategy code review — structural flaws the numbers can’t catch",
      "Downloadable PDF report & saved analysis history",
    ],
  },
];

export default function Pro() {
  const { config, isPro, openUnlock } = useAuth();
  const nav = useNavigate();
  const price = config.price_label || "one-time";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-sm border border-data/30 bg-data/10 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-label text-data">
          TrueSharpe Pro
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-txt sm:text-4xl">
          The whole truth about your backtest
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600 dark:text-txt-muted">
          Free shows you the headline verdict. Pro unlocks the entire diagnostic
          that produced it — every statistic, chart and robustness test, on your
          own data.
        </p>
      </div>

      {isPro ? (
        <div className="mt-6 rounded-md border border-robust/40 bg-robust/10 px-4 py-3 text-center text-sm font-medium text-robust">
          You’re Pro — the full report is unlocked on every analysis.
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center gap-3">
          <button className="btn-primary text-base" onClick={openUnlock}>
            Unlock Pro — {price}
          </button>
          <p className="font-mono text-[11px] uppercase tracking-label text-txt-faint">
            One-time · not a subscription
          </p>
        </div>
      )}

      <div className="mt-10 space-y-6">
        {GROUPS.map((g) => (
          <div key={g.title} className="card p-5">
            <h2 className="mono-label">{g.title}</h2>
            <ul className="mt-3 grid gap-2.5">
              {g.items.map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-txt">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="mt-0.5 shrink-0">
                    <path d="M2.5 7.5l3 3 6-7" stroke="#3FB68B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-md border border-slate-200 bg-slate-50 px-5 py-4 text-sm dark:border-ink-edge dark:bg-ink-elevated">
        <p className="font-semibold text-slate-900 dark:text-txt">Free always includes</p>
        <p className="mt-1 text-slate-600 dark:text-txt-muted">
          The headline verdict on any analysis you run — holds up or likely
          overfit — plus the full report on our built-in sample strategies, so
          you can see exactly what Pro looks like before you buy.
        </p>
      </div>

      {!isPro && (
        <div className="mt-8 flex justify-center gap-3">
          <button className="btn-primary" onClick={openUnlock}>Unlock Pro — {price}</button>
          <button className="btn-ghost" onClick={() => nav("/analyze")}>Run a free verdict</button>
        </div>
      )}

      <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-slate-500 dark:text-txt-faint">
        Statistical analysis only. Not financial advice. TrueSharpe reports
        whether a strategy survives or fails specific robustness checks — it
        never predicts profit.
      </p>
    </div>
  );
}
