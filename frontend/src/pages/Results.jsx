import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "../lib/store.jsx";
import { useAuth } from "../lib/auth.jsx";
import { downloadReport } from "../lib/api.js";
import VerdictCard from "../components/VerdictCard.jsx";
import TradeDependencyCard from "../components/TradeDependencyCard.jsx";
import RiskOfRuinCard from "../components/RiskOfRuinCard.jsx";
import ReturnsHeatmap from "../components/ReturnsHeatmap.jsx";
import MetricRow from "../components/MetricRow.jsx";
import ShareCard from "../components/ShareCard.jsx";
import LockedCard from "../components/LockedCard.jsx";
import EquityChart from "../components/charts/EquityChart.jsx";
import DrawdownChart from "../components/charts/DrawdownChart.jsx";
import HistogramChart from "../components/charts/HistogramChart.jsx";
import MonteCarloChart from "../components/charts/MonteCarloChart.jsx";
import RollingSharpeChart from "../components/charts/RollingSharpeChart.jsx";
import { pct, num, int } from "../lib/format.js";

const SIMPLE_KEYS = ["psr", "dsr", "oos", "benchmark", "montecarlo"];

function ProLock({ onUnlock, className = "" }) {
  return (
    <button
      onClick={onUnlock}
      className={`inline-flex items-center gap-1.5 font-mono font-semibold uppercase tracking-label text-data hover:underline ${className}`}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4.5" y="10.5" width="15" height="9.5" rx="1.6" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 10.5V7.5a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      Pro
    </button>
  );
}

function StatTile({ label, value, locked, onUnlock }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 dark:border-ink-edge dark:bg-ink-elevated">
      <div className="mono-label">{label}</div>
      {locked ? (
        <ProLock onUnlock={onUnlock} className="mt-1.5 text-base" />
      ) : (
        <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-txt">
          {value}
        </div>
      )}
    </div>
  );
}

export default function Results() {
  const { analysis } = useAnalysis();
  const { openUnlock } = useAuth();
  const nav = useNavigate();
  const [detailed, setDetailed] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!analysis) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <h2 className="text-xl font-bold">No analysis yet</h2>
        <p className="mt-2 text-slate-600 dark:text-txt-muted">
          Run a strategy first to see your reality check.
        </p>
        <button className="btn-primary mt-4" onClick={() => nav("/analyze")}>
          Analyze a strategy
        </button>
      </div>
    );
  }

  const { verdict, stats, sharpe, charts, explanations, meta, monte_carlo } =
    analysis;
  const tradeDependency = analysis.trade_dependency;
  const riskOfRuin = analysis.risk_of_ruin;
  const returnsOverTime = analysis.returns_over_time;
  const locked = new Set(analysis.gating?.locked || []);
  const isFree = locked.size > 0;
  const dsrLocked = locked.has("deflated_sharpe");
  const mcLocked = locked.has("monte_carlo");
  const rorLocked = locked.has("risk_of_ruin");
  const pdfLocked = locked.has("pdf_report");

  const rows = explanations || [];
  const shown = detailed ? rows : rows.filter((r) => SIMPLE_KEYS.includes(r.key));

  async function onDownload() {
    if (pdfLocked) {
      openUnlock();
      return;
    }
    setDownloading(true);
    try {
      await downloadReport(analysis);
    } catch (e) {
      if (e.status === 402) openUnlock();
      else alert(e.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-txt">
            Reality Check Report
          </h1>
          <p className="mt-0.5 font-mono text-xs tabular-nums text-slate-500 dark:text-txt-muted">
            {int(meta.n_observations)} observations · {meta.frequency} ·{" "}
            {int(meta.num_trials)} trial(s) tested
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-slate-300 p-0.5 font-mono text-xs uppercase tracking-label dark:border-ink-edge">
            <button
              className={`rounded-sm px-3 py-1.5 font-semibold transition ${!detailed ? "bg-data text-ink-base" : "text-slate-600 dark:text-txt-muted"}`}
              onClick={() => setDetailed(false)}
            >
              Simple
            </button>
            <button
              className={`rounded-sm px-3 py-1.5 font-semibold transition ${detailed ? "bg-data text-ink-base" : "text-slate-600 dark:text-txt-muted"}`}
              onClick={() => setDetailed(true)}
            >
              Detailed
            </button>
          </div>
          <button className="btn-ghost" onClick={() => nav("/analyze")}>
            New analysis
          </button>
          <ShareCard analysis={analysis} />
          <button className="btn-primary" onClick={onDownload} disabled={downloading}>
            {downloading ? "Generating…" : pdfLocked ? "Unlock PDF report" : "Download PDF"}
          </button>
        </div>
      </div>

      {/* Verdict */}
      <VerdictCard verdict={verdict} />

      {/* Unlock banner (free only) */}
      {isFree && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/30 bg-brand/5 px-5 py-4">
          <div>
            <p className="font-semibold">You’re viewing the free report.</p>
            <p className="text-sm text-slate-600 dark:text-txt-muted">
              Unlock Pro for the Deflated Sharpe, PBO, Monte Carlo simulation, and
              the downloadable PDF audit.
            </p>
          </div>
          <button className="btn-primary shrink-0" onClick={openUnlock}>
            Unlock full report
          </button>
        </div>
      )}

      {/* Parsing notes */}
      {meta.parse?.conversions?.length > 0 && (
        <div className="card p-4 text-sm text-slate-600 dark:text-txt-muted">
          <span className="font-semibold">How we read your data: </span>
          {meta.parse.conversions.join(" ")}
        </div>
      )}

      {/* Headline stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Total return" value={pct(stats.total_return)} />
        <StatTile label="CAGR" value={pct(stats.cagr)} />
        <StatTile label="Ann. Sharpe" value={num(stats.sharpe_annualized)} />
        <StatTile label="Max drawdown" value={pct(stats.max_drawdown)} />
        <StatTile label="PSR" value={pct(sharpe.psr)} />
        <StatTile
          label="Deflated Sharpe"
          value={dsrLocked ? null : pct(sharpe.dsr?.dsr)}
          locked={dsrLocked}
          onUnlock={openUnlock}
        />
      </div>

      {/* Trade-dependency / concentration (free) */}
      {tradeDependency && <TradeDependencyCard data={tradeDependency} />}

      {/* Risk of ruin (Pro) */}
      {riskOfRuin?.available ? (
        <RiskOfRuinCard data={riskOfRuin} />
      ) : rorLocked ? (
        <LockedCard
          title="Risk of ruin"
          subtitle="Probability of a deep drawdown across thousands of resampled runs"
          onUnlock={openUnlock}
        />
      ) : null}

      {/* Metrics */}
      <div className="card p-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-txt">
            {detailed ? "All metrics" : "The metrics that matter"}
          </h2>
          {!detailed && (
            <button
              className="font-mono text-xs font-semibold uppercase tracking-label text-data hover:underline"
              onClick={() => setDetailed(true)}
            >
              Show everything →
            </button>
          )}
        </div>
        <div>
          {shown.map((r) => (
            <MetricRow key={r.key} row={r} showPlain />
          ))}
        </div>
        {isFree && (
          <button
            onClick={openUnlock}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-data/40 py-2.5 font-mono text-xs font-semibold uppercase tracking-label text-data hover:bg-data/5"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="4.5" y="10.5" width="15" height="9.5" rx="1.6" stroke="currentColor" strokeWidth="1.8" />
              <path d="M8 10.5V7.5a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Deflated Sharpe, PBO &amp; more — unlock Pro
          </button>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <EquityChart data={charts.equity} />
        <DrawdownChart data={charts.drawdown} />
        {detailed && <HistogramChart data={charts.histogram} />}
        {detailed && charts.rolling_sharpe?.x?.length > 0 && (
          <RollingSharpeChart data={charts.rolling_sharpe} />
        )}
        {charts.monte_carlo ? (
          <div className="lg:col-span-2">
            <MonteCarloChart data={charts.monte_carlo} />
          </div>
        ) : mcLocked ? (
          <div className="lg:col-span-2">
            <LockedCard
              title="Monte Carlo cone"
              subtitle="Thousands of resampled paths + outcome distribution"
              onUnlock={openUnlock}
              tall
            />
          </div>
        ) : null}
      </div>

      {/* Returns-over-time heatmap (free) */}
      {returnsOverTime?.available && <ReturnsHeatmap data={returnsOverTime} />}

      {/* Detailed extras */}
      {detailed && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card p-5">
            <h3 className="mb-3 font-bold">Performance & risk</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Detail k="Annualized volatility" v={pct(stats.annualized_volatility)} />
              <Detail k="Sortino ratio" v={num(stats.sortino)} />
              <Detail k="Calmar ratio" v={num(stats.calmar)} />
              <Detail k="Average drawdown" v={pct(stats.average_drawdown)} />
              <Detail k="Longest drawdown" v={`${int(stats.longest_drawdown_periods)} periods`} />
              <Detail k="Observations" v={int(stats.n_observations)} />
              {stats.trades && (
                <>
                  <Detail k="Win rate" v={pct(stats.trades.win_rate)} />
                  <Detail k="Profit factor" v={num(stats.trades.profit_factor)} />
                  <Detail k="Expectancy" v={num(stats.trades.expectancy, 4)} />
                  <Detail k="Trades" v={int(stats.trades.num_trades)} />
                </>
              )}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="mb-3 font-bold">Sharpe statistics</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Detail k="Per-period Sharpe" v={num(sharpe.per_period_sharpe, 3)} />
              <Detail k="Annualized Sharpe" v={num(sharpe.annualized_sharpe)} />
              <Detail k="PSR (vs 0)" v={pct(sharpe.psr)} />
              <Detail k="Deflated Sharpe" v={pct(sharpe.dsr?.dsr)} locked={dsrLocked} onUnlock={openUnlock} />
              <Detail
                k="Luck-implied max SR"
                v={num(sharpe.dsr?.expected_max_sharpe, 3)}
                locked={dsrLocked}
                onUnlock={openUnlock}
              />
              <Detail k="Skew" v={num(sharpe.skew, 3)} />
              <Detail k="Kurtosis" v={num(sharpe.kurtosis, 2)} />
              <Detail
                k="Min track record"
                v={
                  Number.isFinite(sharpe.min_track_record_length)
                    ? `${int(sharpe.min_track_record_length)} periods`
                    : "∞"
                }
              />
              <Detail
                k="Haircut"
                v={pct(sharpe.haircut_sharpe?.haircut)}
                locked={locked.has("haircut")}
                onUnlock={openUnlock}
              />
              {monte_carlo ? (
                <Detail
                  k="MC percentile"
                  v={`${Math.round(monte_carlo.final_return_percentile)}th`}
                />
              ) : (
                <Detail k="MC percentile" v={null} locked={mcLocked} onUnlock={openUnlock} />
              )}
            </div>
            {sharpe.dsr?.variance_estimated && (
              <p className="mt-3 text-xs text-slate-500">
                Note: the cross-trial Sharpe variance used for deflation was
                estimated conservatively from this strategy’s own sampling
                variance (the full set of trial Sharpes wasn’t provided).
              </p>
            )}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-slate-500">{verdict.disclaimer}</p>
    </div>
  );
}

function Detail({ k, v, locked, onUnlock }) {
  return (
    <>
      <span className="text-slate-500 dark:text-txt-muted">{k}</span>
      {locked ? (
        <ProLock onUnlock={onUnlock} className="justify-self-end text-xs" />
      ) : (
        <span className="text-right font-mono font-medium tabular-nums text-slate-900 dark:text-txt">{v}</span>
      )}
    </>
  );
}
