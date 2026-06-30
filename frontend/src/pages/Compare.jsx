import { useState } from "react";
import { Link } from "react-router-dom";
import { analyze, importStatement } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { pct, num, VERDICT_META } from "../lib/format.js";
import CompareEquityChart from "../components/charts/CompareEquityChart.jsx";

// Comparison rows. `better` says which direction wins; `pro` rows are locked on
// the free tier (the value comes back redacted).
const ROWS = [
  { label: "Total return", get: (a) => a.stats?.total_return, fmt: (x) => pct(x), better: "high" },
  { label: "CAGR", get: (a) => a.stats?.cagr, fmt: (x) => pct(x), better: "high" },
  { label: "Annualized Sharpe", get: (a) => a.stats?.sharpe_annualized, fmt: (x) => num(x), better: "high" },
  { label: "Max drawdown", get: (a) => a.stats?.max_drawdown, fmt: (x) => pct(x), better: "high" },
  { label: "PSR", get: (a) => a.sharpe?.psr, fmt: (x) => pct(x), better: "high" },
  { label: "Sortino", get: (a) => a.stats?.sortino, fmt: (x) => num(x), better: "high" },
  { label: "Calmar", get: (a) => a.stats?.calmar, fmt: (x) => num(x), better: "high" },
  { label: "Out-of-sample degradation", get: (a) => a.overfit?.split_sample?.sharpe_degradation, fmt: (x) => pct(x, 0), better: "low" },
  { label: "Profit concentration (top trades)", get: (a) => (a.trade_dependency?.applicable ? a.trade_dependency.profit_share_top : null), fmt: (x) => pct(x, 0), better: "low" },
  { label: "Deflated Sharpe", get: (a) => a.sharpe?.dsr?.dsr, fmt: (x) => pct(x), better: "high", pro: true },
];

const VERDICT_RANK = { red: 0, yellow: 1, green: 2 };
const isNum = (v) => typeof v === "number" && Number.isFinite(v);

function winner(va, vb, better) {
  if (!isNum(va) || !isNum(vb) || va === vb) return null;
  if (better === "high") return va > vb ? "a" : "b";
  return va < vb ? "a" : "b"; // "low"
}

function VerdictHead({ name, analysis }) {
  const m = VERDICT_META[analysis.verdict.level] || VERDICT_META.yellow;
  return (
    <div className="card relative overflow-hidden">
      <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: m.accent }} aria-hidden="true" />
      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display font-bold tracking-tight text-slate-900 dark:text-txt">{name}</h3>
          <span className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-label ${m.chip}`}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: m.accent }} />
            {m.code}
          </span>
        </div>
        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-txt">{analysis.verdict.headline}</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-txt-muted">{analysis.verdict.summary}</p>
      </div>
    </div>
  );
}

export default function Compare() {
  const { openUnlock, isPro } = useAuth();
  const [a, setA] = useState({ name: "Strategy A", data: "", trials: 1, note: null });
  const [b, setB] = useState({ name: "Strategy B", data: "", trials: 1, note: null });
  const [frequency, setFrequency] = useState("daily");
  const [valueType, setValueType] = useState("auto");
  const [dataKind, setDataKind] = useState("timeseries");
  const [isPercentage, setIsPercentage] = useState("auto");
  const [confidence, setConfidence] = useState(0.95);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  async function onImport(e, set) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    try {
      const r = await importStatement(file);
      if (r.kind === "trades") {
        setDataKind("trades");
        setFrequency("per_trade");
      } else {
        setValueType("equity");
      }
      set((s) => ({ ...s, data: r.text, note: `Imported ${r.n} ${r.kind === "trades" ? "trades" : "points"}` }));
    } catch (err) {
      setError(err.message || "Could not read that file.");
    }
  }

  async function compare() {
    setError(null);
    if (!a.data.trim() || !b.data.trim()) {
      setError("Paste or import data for both strategies first.");
      return;
    }
    setLoading(true);
    setResults(null);
    try {
      const mk = (s) => ({
        data: s.data,
        frequency,
        value_type: valueType,
        is_percentage: isPercentage,
        data_kind: dataKind,
        num_trials: Number(s.trials) || 1,
        confidence: Number(confidence),
      });
      const [ra, rb] = await Promise.all([analyze(mk(a)), analyze(mk(b))]);
      setResults({ a: ra, b: rb, aName: a.name || "Strategy A", bName: b.name || "Strategy B" });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // tally robustness wins (excludes locked pro rows when not comparable)
  let aWins = 0;
  let bWins = 0;
  if (results) {
    for (const row of ROWS) {
      const w = winner(row.get(results.a), row.get(results.b), row.better);
      if (w === "a") aWins++;
      else if (w === "b") bWins++;
    }
  }

  function StrategyInput({ s, set, side }) {
    return (
      <div className="card p-5">
        <input
          className="input mb-3 font-semibold"
          value={s.name}
          onChange={(e) => set((p) => ({ ...p, name: e.target.value }))}
          aria-label={`Strategy ${side} name`}
        />
        <textarea
          className="input h-36 font-mono text-xs"
          placeholder={"return\n0.012\n-0.004\n0.008"}
          value={s.data}
          onChange={(e) => set((p) => ({ ...p, data: e.target.value }))}
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className="btn-ghost cursor-pointer text-xs">
            Import statement
            <input type="file" accept=".htm,.html,.xlsx,.csv,.txt" className="hidden" onChange={(e) => onImport(e, set)} />
          </label>
          <div className="flex items-center gap-1.5">
            <span className="mono-label">trials</span>
            <input
              type="number"
              min="1"
              className="input w-20 py-1 text-sm"
              value={s.trials}
              onChange={(e) => set((p) => ({ ...p, trials: e.target.value }))}
            />
          </div>
        </div>
        {s.note && <p className="mt-2 font-mono text-[11px] uppercase tracking-label text-robust">{s.note}</p>}
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="card relative overflow-hidden border border-data/30">
          <span className="absolute inset-y-0 left-0 w-1 bg-data" aria-hidden="true" />
          <div className="p-8 text-center">
            <div className="flex justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="4.5" y="10.5" width="15" height="9.5" rx="1.6" stroke="#58A6FF" strokeWidth="1.7" />
                <path d="M8 10.5V7.5a4 4 0 018 0v3" stroke="#58A6FF" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-txt">
              Strategy comparison is Pro
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-txt-muted">
              Run two strategies through the full robustness suite side by side
              and see which one holds up. Part of TrueSharpe Pro.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button className="btn-primary" onClick={openUnlock}>Unlock Pro</button>
              <Link to="/pro" className="btn-ghost">See everything in Pro →</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-txt">
        Compare two strategies
      </h1>
      <p className="mt-1 text-slate-600 dark:text-txt-muted">
        Run two strategies through the same checks and see which one holds up —
        side by side. Both share the settings below.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/50 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <StrategyInput s={a} set={setA} side="A" />
        <StrategyInput s={b} set={setB} side="B" />
      </div>

      {/* shared settings */}
      <div className="card mt-4 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label">Frequency</label>
          <select className="input" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            <option value="daily">Daily</option>
            <option value="hourly">Hourly</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="per_trade">Per trade</option>
          </select>
        </div>
        <div>
          <label className="label">Values are…</label>
          <select className="input" value={valueType} onChange={(e) => setValueType(e.target.value)}>
            <option value="auto">Auto-detect</option>
            <option value="returns">Returns</option>
            <option value="equity">Equity curve</option>
          </select>
        </div>
        <div>
          <label className="label">Data type</label>
          <select className="input" value={dataKind} onChange={(e) => setDataKind(e.target.value)}>
            <option value="timeseries">Time-series</option>
            <option value="trades">Per-trade P&amp;L</option>
          </select>
        </div>
        <div>
          <label className="label">Confidence</label>
          <select className="input" value={confidence} onChange={(e) => setConfidence(e.target.value)}>
            <option value="0.9">90%</option>
            <option value="0.95">95%</option>
            <option value="0.99">99%</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button className="btn-primary" onClick={compare} disabled={loading}>
          {loading ? "Comparing…" : "Compare →"}
        </button>
      </div>

      {results && (
        <div className="mt-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <VerdictHead name={results.aName} analysis={results.a} />
            <VerdictHead name={results.bName} analysis={results.b} />
          </div>

          <div className="rounded-lg border border-data/30 bg-data/5 px-5 py-3 text-sm">
            <span className="font-semibold text-slate-900 dark:text-txt">
              {aWins === bWins
                ? "Evenly matched"
                : `${aWins > bWins ? results.aName : results.bName} leads`}
            </span>{" "}
            <span className="text-slate-600 dark:text-txt-muted">
              — {results.aName} wins {aWins}, {results.bName} wins {bWins} of the
              comparable measures below.
            </span>
          </div>

          <CompareEquityChart
            aName={results.aName}
            bName={results.bName}
            a={results.a.charts?.equity?.strategy}
            b={results.b.charts?.equity?.strategy}
          />

          {/* comparison table */}
          <div className="card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b hairline text-txt-muted">
                  <th className="px-4 py-2.5 font-mono text-[11px] font-medium uppercase tracking-label">Measure</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-slate-900 dark:text-txt">{results.aName}</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-slate-900 dark:text-txt">{results.bName}</th>
                </tr>
              </thead>
              <tbody>
                {/* verdict row */}
                <VerdictRow a={results.a} b={results.b} />
                {ROWS.map((row) => {
                  const va = row.get(results.a);
                  const vb = row.get(results.b);
                  const w = winner(va, vb, row.better);
                  return (
                    <tr key={row.label} className="border-b border-slate-100 last:border-0 dark:border-ink-edge/60">
                      <td className="px-4 py-2.5 text-slate-600 dark:text-txt-muted">{row.label}</td>
                      <Cell v={va} fmt={row.fmt} win={w === "a"} pro={row.pro} onUnlock={openUnlock} />
                      <Cell v={vb} fmt={row.fmt} win={w === "b"} pro={row.pro} onUnlock={openUnlock} />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function VerdictRow({ a, b }) {
  const ma = VERDICT_META[a.verdict.level] || VERDICT_META.yellow;
  const mb = VERDICT_META[b.verdict.level] || VERDICT_META.yellow;
  const ra = VERDICT_RANK[a.verdict.level] ?? 1;
  const rb = VERDICT_RANK[b.verdict.level] ?? 1;
  const chip = (m, win) => (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-label ${m.chip} ${win ? "ring-1 ring-robust" : ""}`}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: m.accent }} />
      {m.code}
    </span>
  );
  return (
    <tr className="border-b border-slate-100 dark:border-ink-edge/60">
      <td className="px-4 py-2.5 text-slate-600 dark:text-txt-muted">Verdict</td>
      <td className="px-4 py-2.5 text-right">{chip(ma, ra > rb)}</td>
      <td className="px-4 py-2.5 text-right">{chip(mb, rb > ra)}</td>
    </tr>
  );
}

function Cell({ v, fmt, win, pro, onUnlock }) {
  const numeric = typeof v === "number" && Number.isFinite(v);
  if (!numeric && pro) {
    return (
      <td className="px-4 py-2.5 text-right">
        <button onClick={onUnlock} className="font-mono text-xs font-semibold uppercase tracking-label text-data hover:underline">
          Pro
        </button>
      </td>
    );
  }
  return (
    <td className={`px-4 py-2.5 text-right font-mono tabular-nums ${win ? "font-bold text-robust" : "text-slate-900 dark:text-txt"}`}>
      {win && <span aria-hidden="true">▲ </span>}
      {numeric ? fmt(v) : "n/a"}
    </td>
  );
}
