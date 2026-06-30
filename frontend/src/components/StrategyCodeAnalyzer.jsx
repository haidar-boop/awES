import { useState } from "react";
import { useAuth } from "../lib/auth.jsx";
import { analyzeStrategyCode } from "../lib/api.js";
import VerdictCard from "./VerdictCard.jsx";
import { STATUS_META } from "../lib/format.js";

const LANGS = [
  ["auto", "Auto-detect"],
  ["python", "Python"],
  ["pinescript", "Pine Script (TradingView)"],
  ["mql", "MQL4 / MQL5 (MT4/5)"],
  ["easylanguage", "EasyLanguage"],
  ["ninjascript", "NinjaScript"],
  ["plain", "Plain-English rules"],
];

const SEV_LABEL = { fail: "Fail", caution: "Caution", pass: "Pass" };
const sevMeta = (s) => STATUS_META[s === "caution" ? "warn" : s] || STATUS_META.info;

function Finding({ f }) {
  const [open, setOpen] = useState(false);
  const m = sevMeta(f.severity);
  return (
    <div className="border-b border-slate-100 py-3 last:border-0 dark:border-slate-800">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2 font-semibold">
          <span className={`h-2 w-2 rounded-full ${m.dot}`} />
          {f.category}
        </span>
        <span className={`flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-label ${m.text}`}>
          {SEV_LABEL[f.severity] || "Info"}
          <svg
            width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true"
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="mt-2 space-y-2 text-sm">
          {f.evidence && (
            <pre className="overflow-x-auto rounded-lg bg-slate-100 p-2 text-xs dark:bg-slate-800">
              {f.evidence}
            </pre>
          )}
          {f.why && (
            <p><span className="font-semibold">Why it matters: </span>{f.why}</p>
          )}
          {f.fix && (
            <p className="text-slate-600 dark:text-slate-300">
              <span className="font-semibold">Suggested fix: </span>{f.fix}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function StrategyCodeAnalyzer() {
  const { isPro, config, openUnlock } = useAuth();
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("auto");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 64 * 1024) {
      setError("File too large — keep it under 64 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCode(String(reader.result || ""));
    reader.readAsText(file);
  }

  async function run() {
    setError(null);
    if (!code.trim()) {
      setError("Paste your strategy code or rules first.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const r = await analyzeStrategyCode({ code, language, context });
      setResult(r);
    } catch (e) {
      if (e.status === 402) openUnlock();
      else setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-slate-900 dark:text-txt">
          AI strategy code review
          <span className="rounded-sm border border-data/30 bg-data/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-label text-data">
            Pro
          </span>
        </h2>
      </div>
      <p className="mt-1 text-sm text-slate-600 dark:text-txt-muted">
        Paste your strategy’s code or rules and an AI reads it for structural flaws
        the numbers can’t catch — lookahead bias, curve-fitting, unrealistic fills.
      </p>

      {/* Free users: locked, NO AI call is ever made */}
      {!isPro ? (
        <div className="mt-4 grid place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-ink-edge dark:bg-ink-deep/60">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="4.5" y="10.5" width="15" height="9.5" rx="1.6" stroke="#8B97A6" strokeWidth="1.7" />
            <path d="M8 10.5V7.5a4 4 0 018 0v3" stroke="#8B97A6" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          <p className="mono-label mt-2">Pro feature</p>
          <button className="btn-primary mt-3" onClick={openUnlock}>
            Unlock full report
          </button>
        </div>
      ) : config.ai_enabled === false ? (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          AI review isn’t switched on for this deployment yet.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          <textarea
            className="input h-44 font-mono text-xs"
            placeholder={"# paste your strategy code or rules here\nif close > sma(close, 50):\n    buy()"}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="btn-ghost cursor-pointer">
              Upload file
              <input type="file" className="hidden"
                     accept=".py,.txt,.pine,.mq4,.mq5,.cs,.el,.md" onChange={onFile} />
            </label>
            <select className="input max-w-xs" value={language}
                    onChange={(e) => setLanguage(e.target.value)}>
              {LANGS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <input
            className="input"
            placeholder="Optional context — e.g. EUR/USD, 1h, optimized 8 parameters"
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Your code isn’t stored. It’s sent to the AI provider only to analyze.
            </p>
            <button className="btn-primary" onClick={run} disabled={loading}>
              {loading ? "Analyzing…" : "Analyze code"}
            </button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {result && (
            <div className="space-y-4 pt-2">
              <VerdictCard verdict={result.verdict} />
              {result.findings?.length > 0 && (
                <div className="card p-4">
                  <h3 className="mb-1 font-bold">Findings</h3>
                  {result.findings.map((f, i) => <Finding key={i} f={f} />)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
