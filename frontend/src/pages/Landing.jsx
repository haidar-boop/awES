import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchSample } from "../lib/api.js";
import { useAnalysis } from "../lib/store.jsx";

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
  const { setAnalysis } = useAnalysis();
  const [loading, setLoading] = useState(null);

  async function runSample(name) {
    setLoading(name);
    try {
      const s = await fetchSample(name);
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
          <span className="inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
            Honest backtest auditing
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Your backtest looks great.
            <br />
            <span className="text-brand">Will it survive live?</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-slate-600 dark:text-slate-300">
            Most amazing backtests lose money live because they’re overfit. Paste
            your results and get a clear, statistical verdict —{" "}
            <strong>holds up</strong> or <strong>likely overfit</strong> — using
            the same robustness tests quants use, in plain English.
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
          <p className="mt-3 text-xs text-slate-500">
            No signup. We never say a strategy is “profitable” — only whether it
            passes or fails specific checks.
          </p>
        </div>

        {/* Sample picker card */}
        <div className="card p-6">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            See it instantly
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Run a built-in example and jump straight to a full report.
          </p>
          <div className="mt-4 space-y-3">
            <button
              onClick={() => runSample("overfit")}
              disabled={loading}
              className="flex w-full items-center justify-between rounded-lg border border-red-600/30 bg-red-50 px-4 py-3 text-left hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50"
            >
              <span>
                <span className="font-semibold">🔴 Overfit EA</span>
                <span className="block text-xs text-slate-500">
                  Gorgeous in-sample, collapses out-of-sample, 50 trials
                </span>
              </span>
              <span className="text-sm font-semibold text-red-600">
                {loading === "overfit" ? "…" : "Run →"}
              </span>
            </button>
            <button
              onClick={() => runSample("robust")}
              disabled={loading}
              className="flex w-full items-center justify-between rounded-lg border border-green-600/30 bg-green-50 px-4 py-3 text-left hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-950/50"
            >
              <span>
                <span className="font-semibold">🟢 Robust trend filter</span>
                <span className="block text-xs text-slate-500">
                  Consistent, survives deflation, beats buy-and-hold
                </span>
              </span>
              <span className="text-sm font-semibold text-green-600">
                {loading === "robust" ? "…" : "Run →"}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Why backtests lie */}
      <section>
        <h2 className="text-2xl font-bold">Why backtests lie</h2>
        <p className="mt-1 max-w-2xl text-slate-600 dark:text-slate-300">
          A backtest is a story about the past. These are the four ways that story
          fools traders — and exactly what we test for.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map((r) => (
            <div key={r.title} className="card p-5">
              <h3 className="font-semibold">{r.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {r.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Checks */}
      <section className="card p-6">
        <h2 className="text-2xl font-bold">What we check</h2>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          Established statistical methods, run automatically and explained for
          beginners and quants alike.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {CHECKS.map((c) => (
            <div
              key={c}
              className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800"
            >
              <span className="text-brand">✓</span>
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
