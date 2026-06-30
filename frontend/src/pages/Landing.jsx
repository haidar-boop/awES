import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchSample } from "../lib/api.js";
import { useAnalysis } from "../lib/store.jsx";
import TruthCollapse from "../components/TruthCollapse.jsx";

const REASONS = [
  {
    title: "Curve-fitting",
    body: "Tune enough parameters and any strategy fits the past perfectly. That fit rarely survives into the future.",
  },
  {
    title: "Multiple testing",
    body: "Try 100 variations and keep the best, and the “best” is mostly luck. The more you tried, the more the Sharpe must be deflated.",
  },
  {
    title: "Lucky ordering",
    body: "A handful of well-placed winners can flatter an equity curve. Reshuffle the trades and the magic often disappears.",
  },
  {
    title: "Short track records",
    body: "A great Sharpe over 40 trades is statistical noise. There’s a minimum history needed before a result means anything.",
  },
];

const CHECKS = [
  "Probabilistic Sharpe Ratio (PSR)",
  "Deflated Sharpe Ratio (DSR)",
  "In/out-of-sample degradation",
  "Backtest-overfit probability (PBO)",
  "Monte Carlo reshuffling",
  "Buy-and-hold benchmark",
  "Minimum track record length",
  "Fat tails, skew & autocorrelation",
];

export default function Landing() {
  const nav = useNavigate();
  const { setAnalysis, setRequest } = useAnalysis();
  const [loading, setLoading] = useState(null);

  async function runSample(name) {
    setLoading(name);
    try {
      const s = await fetchSample(name);
      setRequest(null); // samples are the full demo; nothing to re-run
      setAnalysis(s.analysis);
      nav("/results");
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-sm border border-ink-edge bg-ink-elevated px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-label text-txt-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-data" />
            Honest backtest auditing
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight text-slate-900 dark:text-txt sm:text-5xl">
            Your backtest looks great.
            <br />
            <span className="text-data">Will it survive live?</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-txt-muted">
            Most amazing backtests lose money live because they’re overfit. Paste
            your results and get a clear, statistical verdict —{" "}
            <strong className="text-slate-900 dark:text-txt">holds up</strong> or{" "}
            <strong className="text-slate-900 dark:text-txt">likely overfit</strong>{" "}
            — using the same robustness tests quants use, in plain English.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="btn-primary" onClick={() => nav("/analyze")}>
              Analyze my strategy
            </button>
            <button
              className="btn-ghost"
              disabled={loading}
              onClick={() => runSample("overfit")}
            >
              {loading === "overfit" ? "Loading…" : "Try with sample data"}
            </button>
          </div>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-label text-slate-500 dark:text-txt-faint">
            No signup · We never call a strategy “profitable” — only whether it
            passes specific checks
          </p>
        </div>

        {/* Signature: the truth collapse */}
        <TruthCollapse />
      </section>

      {/* Sample runs */}
      <section className="card p-6">
        <h2 className="mono-label">See it instantly</h2>
        <p className="mt-2 text-slate-600 dark:text-txt-muted">
          Run a built-in example and jump straight to a full diagnostic report.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => runSample("overfit")}
            disabled={loading}
            className="group flex items-center justify-between rounded-md border border-overfit/30 bg-overfit/5 px-4 py-3 text-left transition hover:border-overfit/60 hover:bg-overfit/10"
          >
            <span>
              <span className="flex items-center gap-2 font-semibold text-slate-900 dark:text-txt">
                <span className="h-2 w-2 rounded-full bg-overfit" />
                Overfit EA
              </span>
              <span className="mt-0.5 block text-xs text-slate-500 dark:text-txt-muted">
                Gorgeous in-sample, collapses out-of-sample, 50 trials
              </span>
            </span>
            <span className="font-mono text-xs font-semibold uppercase tracking-label text-overfit">
              {loading === "overfit" ? "…" : "Run →"}
            </span>
          </button>
          <button
            onClick={() => runSample("robust")}
            disabled={loading}
            className="group flex items-center justify-between rounded-md border border-robust/30 bg-robust/5 px-4 py-3 text-left transition hover:border-robust/60 hover:bg-robust/10"
          >
            <span>
              <span className="flex items-center gap-2 font-semibold text-slate-900 dark:text-txt">
                <span className="h-2 w-2 rounded-full bg-robust" />
                Robust trend filter
              </span>
              <span className="mt-0.5 block text-xs text-slate-500 dark:text-txt-muted">
                Consistent, survives deflation, beats buy-and-hold
              </span>
            </span>
            <span className="font-mono text-xs font-semibold uppercase tracking-label text-robust">
              {loading === "robust" ? "…" : "Run →"}
            </span>
          </button>
        </div>
      </section>

      {/* Why backtests lie */}
      <section>
        <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-txt">
          Why backtests lie
        </h2>
        <p className="mt-1 max-w-2xl text-slate-600 dark:text-txt-muted">
          A backtest is a story about the past. These are the four ways that story
          fools traders — and exactly what we test for.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map((r, i) => (
            <div key={r.title} className="card p-5">
              <span className="mono-label">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-2 font-semibold text-slate-900 dark:text-txt">{r.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-txt-muted">
                {r.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Checks */}
      <section className="card p-6">
        <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-txt">
          What we check
        </h2>
        <p className="mt-1 text-slate-600 dark:text-txt-muted">
          Established statistical methods, run automatically and explained for
          beginners and quants alike.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {CHECKS.map((c) => (
            <div
              key={c}
              className="flex items-center gap-2.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 dark:border-ink-edge dark:bg-ink-elevated dark:text-txt"
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="shrink-0">
                <path d="M2.5 7.5l3 3 6-7" stroke="#3FB68B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {c}
            </div>
          ))}
        </div>
        <div className="mt-6">
          <button className="btn-primary" onClick={() => nav("/analyze")}>
            Analyze my strategy →
          </button>
        </div>
      </section>
    </div>
  );
}
