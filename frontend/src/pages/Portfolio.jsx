import { useState } from "react";
import { Link } from "react-router-dom";
import { buildPortfolio, importStatement } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { pct, num, VERDICT_META } from "../lib/format.js";
import VerdictCard from "../components/VerdictCard.jsx";
import CorrelationMatrix from "../components/CorrelationMatrix.jsx";
import EquityChart from "../components/charts/EquityChart.jsx";

const DIV_ACCENT = { pass: "#3FB68B", warn: "#D9A441", fail: "#E5534B" };
const DIV_LABEL = { pass: "Diversified", warn: "Partial overlap", fail: "Same bet" };

function letter(i) {
  return String.fromCharCode(65 + i);
}

function ProWall({ onUnlock }) {
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
            Portfolio analysis is Pro
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-txt-muted">
            Combine up to six strategies into one portfolio, see their correlation
            matrix, and run the full robustness suite on the blend. Part of
            TrueSharpe Pro.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button className="btn-primary" onClick={onUnlock}>Unlock Pro</button>
            <Link to="/pro" className="btn-ghost">See everything in Pro →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Portfolio() {
  const { openUnlock, isPro } = useAuth();
  const [strategies, setStrategies] = useState([
    { name: "Strategy A", data: "", weight: 1, note: null },
    { name: "Strategy B", data: "", weight: 1, note: null },
  ]);
  const [frequency, setFrequency] = useState("daily");
  const [valueType, setValueType] = useState("auto");
  const [dataKind, setDataKind] = useState("timeseries");
  const [isPercentage, setIsPercentage] = useState("auto");
  const [confidence, setConfidence] = useState(0.95);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const patch = (i, p) => setStrategies((xs) => xs.map((s, j) => (j === i ? { ...s, ...p } : s)));
  const addStrategy = () =>
    setStrategies((xs) => (xs.length >= 6 ? xs : [...xs, { name: `Strategy ${letter(xs.length)}`, data: "", weight: 1, note: null }]));
  const removeStrategy = (i) => setStrategies((xs) => (xs.length <= 2 ? xs : xs.filter((_, j) => j !== i)));

  async function onImport(e, i) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    try {
      const r = await importStatement(file);
      if (r.kind === "trades") {
        setDataKind("trades");
        setFrequency("per_trade");
      } else setValueType("equity");
      patch(i, { data: r.text, note: `Imported ${r.n} ${r.kind === "trades" ? "trades" : "points"}` });
    } catch (err) {
      setError(err.message || "Could not read that file.");
    }
  }

  async function build() {
    setError(null);
    if (strategies.some((s) => !s.data.trim())) {
      setError("Add data for every strategy (or remove the empty ones).");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const payload = {
        strategies: strategies.map((s) => ({ name: s.name, data: s.data, weight: Number(s.weight) || 1 })),
        frequency,
        value_type: valueType,
        is_percentage: isPercentage,
        data_kind: dataKind,
        confidence: Number(confidence),
      };
      setResult(await buildPortfolio(payload));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isPro) return <ProWall onUnlock={openUnlock} />;

  const p = result?.portfolio;
  const divAccent = result ? DIV_ACCENT[result.diversification_status] : null;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-txt">
        Combine a portfolio
      </h1>
      <p className="mt-1 text-slate-600 dark:text-txt-muted">
        Blend two to six strategies, see how correlated they really are, and run
        the full suite on the combined stream. Weights are relative.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/50 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {strategies.map((s, i) => (
          <div key={i} className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <input
                className="input font-semibold"
                value={s.name}
                onChange={(e) => patch(i, { name: e.target.value })}
                aria-label={`Strategy ${i + 1} name`}
              />
              {strategies.length > 2 && (
                <button className="btn-ghost px-2.5" onClick={() => removeStrategy(i)} title="Remove">
                  ✕
                </button>
              )}
            </div>
            <textarea
              className="input h-28 font-mono text-xs"
              placeholder={"return\n0.012\n-0.004\n0.008"}
              value={s.data}
              onChange={(e) => patch(i, { data: e.target.value })}
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="btn-ghost cursor-pointer text-xs">
                Import
                <input type="file" accept=".htm,.html,.xlsx,.csv,.txt" className="hidden" onChange={(e) => onImport(e, i)} />
              </label>
              <div className="flex items-center gap-1.5">
                <span className="mono-label">weight</span>
                <input
                  type="number" min="0" step="0.5"
                  className="input w-20 py-1 text-sm"
                  value={s.weight}
                  onChange={(e) => patch(i, { weight: e.target.value })}
                />
              </div>
            </div>
            {s.note && <p className="mt-2 font-mono text-[11px] uppercase tracking-label text-robust">{s.note}</p>}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3">
        {strategies.length < 6 && (
          <button className="btn-ghost" onClick={addStrategy}>+ Add strategy</button>
        )}
      </div>

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
        <button className="btn-primary" onClick={build} disabled={loading}>
          {loading ? "Building…" : "Build portfolio →"}
        </button>
      </div>

      {result && (
        <div className="mt-8 space-y-6">
          {/* diversification */}
          <div className="card relative overflow-hidden">
            <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: divAccent }} aria-hidden="true" />
            <div className="px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="mono-label">Diversification</h3>
                <span className="inline-flex items-center gap-1.5 rounded-sm border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-label dark:border-ink-edge dark:bg-ink-elevated">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: divAccent }} />
                  {DIV_LABEL[result.diversification_status]}
                </span>
              </div>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-700 dark:text-txt">
                {result.diversification_message}
              </p>
              <div className="mt-4">
                <CorrelationMatrix labels={result.labels} matrix={result.correlation} />
              </div>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-label text-txt-faint">
                {result.n_aligned} overlapping periods · low = independent (good), high = same bet
              </p>
            </div>
          </div>

          {/* per-strategy weights */}
          <div className="card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b hairline text-txt-muted">
                  <th className="px-4 py-2.5 font-mono text-[11px] font-medium uppercase tracking-label">Strategy</th>
                  <th className="px-4 py-2.5 text-right font-mono text-[11px] font-medium uppercase tracking-label">Weight</th>
                  <th className="px-4 py-2.5 text-right font-mono text-[11px] font-medium uppercase tracking-label">Sharpe</th>
                  <th className="px-4 py-2.5 text-right font-mono text-[11px] font-medium uppercase tracking-label">Return</th>
                </tr>
              </thead>
              <tbody>
                {result.per_strategy.map((s, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0 dark:border-ink-edge/60">
                    <td className="px-4 py-2.5 text-slate-900 dark:text-txt">{s.name}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-700 dark:text-txt">{pct(s.weight, 0)}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-700 dark:text-txt">{num(s.sharpe)}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-700 dark:text-txt">{pct(s.return)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* combined portfolio */}
          {p && (
            <>
              <h2 className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-txt">
                Combined portfolio
              </h2>
              <VerdictCard verdict={p.verdict} />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <Tile label="Total return" value={pct(p.stats.total_return)} />
                <Tile label="CAGR" value={pct(p.stats.cagr)} />
                <Tile label="Ann. Sharpe" value={num(p.stats.sharpe_annualized)} />
                <Tile label="Max drawdown" value={pct(p.stats.max_drawdown)} />
                <Tile label="PSR" value={pct(p.sharpe.psr)} />
              </div>
              {p.charts?.equity && <EquityChart data={p.charts.equity} />}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Tile({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 dark:border-ink-edge dark:bg-ink-elevated">
      <div className="mono-label">{label}</div>
      <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-txt">{value}</div>
    </div>
  );
}
