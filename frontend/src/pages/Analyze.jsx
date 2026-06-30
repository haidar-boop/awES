import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { analyze, fetchSample, importStatement } from "../lib/api.js";
import { useAnalysis } from "../lib/store.jsx";
import Tooltip from "../components/Tooltip.jsx";
import StrategyCodeAnalyzer from "../components/StrategyCodeAnalyzer.jsx";

const EXAMPLE_CSV = `return
0.012
-0.004
0.008
0.021
-0.015
0.006`;

export default function Analyze() {
  const nav = useNavigate();
  const { setAnalysis, setRequest } = useAnalysis();

  const [data, setData] = useState("");
  const [benchmark, setBenchmark] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [valueType, setValueType] = useState("auto");
  const [dataKind, setDataKind] = useState("timeseries");
  const [isPercentage, setIsPercentage] = useState("auto");
  const [numTrials, setNumTrials] = useState(1);
  const [confidence, setConfidence] = useState(0.95);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importInfo, setImportInfo] = useState(null);

  function onFile(e, setter) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("File exceeds the 5 MB limit.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setter(String(reader.result || ""));
    reader.readAsText(file);
  }

  const SOURCE_LABEL = {
    mt4_mt5_html: "MT4 / MT5 statement",
    xlsx: "spreadsheet export",
    csv: "CSV export",
  };

  // Import a broker / platform export: the server extracts the P&L (or equity)
  // column and we drop it into the form so the normal analyze flow runs on it.
  async function onImport(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("File exceeds the 5 MB limit.");
      return;
    }
    setError(null);
    setImportInfo(null);
    setImporting(true);
    try {
      const res = await importStatement(file);
      setData(res.text);
      if (res.kind === "trades") {
        setDataKind("trades");
        setValueType("auto");
        setFrequency("per_trade");
      } else {
        setDataKind("timeseries");
        setValueType("equity");
      }
      setImportInfo({
        source: SOURCE_LABEL[res.source_format] || "export",
        n: res.n,
        kind: res.kind,
        column: res.column,
        notes: res.notes || [],
      });
    } catch (err) {
      setError(
        err.message ||
          "Could not read that file. Try exporting as CSV, or paste your data below."
      );
    } finally {
      setImporting(false);
    }
  }

  async function submit() {
    setError(null);
    if (!data.trim()) {
      setError("Paste your returns/equity data or upload a CSV first.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        data,
        benchmark: benchmark.trim() || null,
        frequency,
        value_type: valueType,
        data_kind: dataKind,
        is_percentage: isPercentage,
        num_trials: Number(numTrials) || 1,
        confidence: Number(confidence),
      };
      const result = await analyze(payload);
      setRequest(payload); // remember inputs so Unlock can re-run as Pro
      setAnalysis(result);
      nav("/results");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function runSample(name) {
    setLoading(true);
    setError(null);
    try {
      const s = await fetchSample(name);
      setRequest(null); // samples are the full demo; nothing to re-run
      setAnalysis(s.analysis);
      nav("/results");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-txt">
        Analyze a strategy
      </h1>
      <p className="mt-1 text-slate-600 dark:text-txt-muted">
        Paste a single column of returns or an equity curve (CSV or one value per
        line). We’ll detect the format and run every robustness check.
      </p>

      {loading && (
        <div className="mt-6 card flex items-center gap-3 p-6">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-data border-t-transparent" />
          <span className="font-mono text-sm uppercase tracking-label text-txt-muted">
            Running robustness checks…
          </span>
        </div>
      )}

      {!loading && (
        <div className="mt-6 space-y-6">
          {error && (
            <div className="rounded-lg border border-red-500/50 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Import from a trading platform */}
          <div className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="mono-label">Import from your platform</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-txt-muted">
                  Upload an MT4 / MT5 statement, TradingView or cTrader export
                  and we’ll pull out your P&amp;L automatically — no manual
                  formatting.
                </p>
              </div>
              <label className={`btn-primary cursor-pointer ${importing ? "pointer-events-none opacity-60" : ""}`}>
                {importing ? "Reading…" : "Import statement"}
                <input
                  type="file"
                  accept=".htm,.html,.xlsx,.csv,.txt"
                  className="hidden"
                  onChange={onImport}
                  disabled={importing}
                />
              </label>
            </div>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-label text-txt-faint">
              MT4 / MT5 (.htm)&nbsp;·&nbsp;TradingView / MT5 (.xlsx)&nbsp;·&nbsp;cTrader / CSV
            </p>
            {importInfo && (
              <div className="mt-3 rounded-md border border-robust/30 bg-robust/5 px-3 py-2.5 text-sm">
                <p className="flex items-center gap-2 font-medium text-robust">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2.5 7.5l3 3 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Imported {importInfo.n}{" "}
                  {importInfo.kind === "trades" ? "trades" : "points"} from your{" "}
                  {importInfo.source}
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-txt-muted">
                  Read the <span className="font-mono">{importInfo.column}</span>{" "}
                  column. Review it below and run the analysis.
                  {importInfo.notes.length > 0 && " " + importInfo.notes.join(" ")}
                </p>
              </div>
            )}
          </div>

          {/* Data input */}
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <label className="label mb-0">Your strategy data</label>
              <button
                className="text-xs font-semibold text-brand hover:underline"
                onClick={() => runSample("overfit")}
                type="button"
              >
                or try sample data →
              </button>
            </div>
            <textarea
              className="input mt-2 h-44 font-mono text-xs"
              placeholder={EXAMPLE_CSV}
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              <label className="btn-ghost cursor-pointer">
                Upload CSV
                <input
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={(e) => onFile(e, setData)}
                />
              </label>
              <details className="text-xs text-slate-500">
                <summary className="cursor-pointer">Expected format</summary>
                <pre className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-ink-edge dark:bg-ink-deep">
{EXAMPLE_CSV}
                </pre>
                <p className="mt-1">
                  One value per row. Headers, dates, and extra columns are handled
                  automatically. Equity curves are converted to returns.
                </p>
              </details>
            </div>
          </div>

          {/* Questions */}
          <div className="card grid gap-5 p-5 sm:grid-cols-2">
            <div>
              <label className="label">Return frequency</label>
              <select
                className="input"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                <option value="daily">Daily</option>
                <option value="hourly">Hourly</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="per_trade">Per trade</option>
              </select>
            </div>

            <div>
              <label className="label">Values are…</label>
              <select
                className="input"
                value={valueType}
                onChange={(e) => setValueType(e.target.value)}
              >
                <option value="auto">Auto-detect</option>
                <option value="returns">Per-period returns</option>
                <option value="equity">An equity curve</option>
              </select>
            </div>

            <div>
              <label className="label">Returns scale</label>
              <select
                className="input"
                value={isPercentage}
                onChange={(e) => setIsPercentage(e.target.value)}
              >
                <option value="auto">Auto-detect</option>
                <option value="false">Decimal (0.01 = 1%)</option>
                <option value="true">Percent (1.0 = 1%)</option>
              </select>
            </div>

            <div>
              <label className="label">Data type</label>
              <select
                className="input"
                value={dataKind}
                onChange={(e) => setDataKind(e.target.value)}
              >
                <option value="timeseries">Time-series returns</option>
                <option value="trades">Per-trade P&amp;L</option>
              </select>
            </div>

            <div>
              <label className="label flex items-center">
                Variations tested
                <Tooltip text="How many strategy versions / parameter sets did you try before settling on this one? Count every tweak you A/B-tested. More trials → the Deflated Sharpe is lowered, because the 'best' of many tries is often just luck." />
              </label>
              <input
                type="number"
                min="1"
                className="input"
                value={numTrials}
                onChange={(e) => setNumTrials(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Confidence level</label>
              <select
                className="input"
                value={confidence}
                onChange={(e) => setConfidence(e.target.value)}
              >
                <option value="0.9">90%</option>
                <option value="0.95">95%</option>
                <option value="0.99">99%</option>
              </select>
            </div>
          </div>

          {/* Optional benchmark */}
          <div className="card p-5">
            <label className="label">Benchmark (optional)</label>
            <p className="mb-2 text-xs text-slate-500">
              Paste buy-and-hold returns to compare against. If omitted, we assume
              a flat 0% benchmark and label it clearly.
            </p>
            <textarea
              className="input h-24 font-mono text-xs"
              placeholder={"benchmark\n0.001\n-0.002\n…"}
              value={benchmark}
              onChange={(e) => setBenchmark(e.target.value)}
            />
            <label className="btn-ghost mt-2 inline-flex cursor-pointer">
              Upload benchmark CSV
              <input
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={(e) => onFile(e, setBenchmark)}
              />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <button className="btn-ghost" onClick={() => runSample("robust")}>
              Try robust sample
            </button>
            <button className="btn-primary" onClick={submit} disabled={loading}>
              Run analysis →
            </button>
          </div>
        </div>
      )}

      {/* AI strategy code review (separate from the returns analysis above) */}
      <div className="mt-8">
        <StrategyCodeAnalyzer />
      </div>
    </div>
  );
}
