import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "../lib/store.jsx";
import { downloadReport } from "../lib/api.js";
import VerdictCard from "../components/VerdictCard.jsx";
import MetricRow from "../components/MetricRow.jsx";
import EquityChart from "../components/charts/EquityChart.jsx";
import DrawdownChart from "../components/charts/DrawdownChart.jsx";
import HistogramChart from "../components/charts/HistogramChart.jsx";
import MonteCarloChart from "../components/charts/MonteCarloChart.jsx";
import RollingSharpeChart from "../components/charts/RollingSharpeChart.jsx";
import { pct, num, int } from "../lib/format.js";

const SIMPLE_KEYS = ["psr", "dsr", "oos", "benchmark", "montecarlo"];

function StatTile({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-100 px-4 py-3 dark:bg-slate-800">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 font-mono text-lg font-semibold">{value}</div>
    </div>
  );
}

export default function Results() {
  const { analysis } = useAnalysis();
  const nav = useNavigate();
  const [detailed, setDetailed] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!analysis) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <h2 className="text-xl font-bold">No analysis yet</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
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
  const rows = explanations || [];
  const shown = detailed ? rows : rows.filter((r) => SIMPLE_KEYS.includes(r.key));

  async function onDownload() {
    setDownloading(true);
    try {
      await downloadReport(analysis);
    } catch (e) {
      alert(e.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Reality Check Report</h1>
          <p className="text-sm text-slate-500">
            {int(meta.n_observations)} observations · {meta.frequency} ·{" "}
            {int(meta.num_trials)} trial(s) tested
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-300 p-0.5 text-sm dark:border-slate-700">
            <button
              className={`rounded-md px-3 py-1.5 font-medium ${!detailed ? "bg-brand text-white" : "text-slate-600 dark:text-slate-300"}`}
              onClick={() => setDetailed(false)}
            >
              Simple
            </button>
            <button
              className={`rounded-md px-3 py-1.5 font-medium ${detailed ? "bg-brand text-white" : "text-slate-600 dark:text-slate-300"}`}
              onClick={() => setDetailed(true)}
            >
              Detailed
            </button>
          </div>
          <button className="btn-ghost" onClick={() => nav("/analyze")}>
            New analysis
          </button>
          <button className="btn-primary" onClick={onDownload} disabled={downloading}>
            {downloading ? "Generating…" : "Download PDF"}
          </button>
        </div>
      </div>

      {/* Verdict */}
      <VerdictCard verdict={verdict} />

      {/* Parsing notes */}
      {meta.parse?.conversions?.length > 0 && (
        <div className="card p-4 text-sm text-slate-600 dark:text-slate-300">
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
        <StatTile label="Deflated Sharpe" value={pct(sharpe.dsr.dsr)} />
      </div>

      {/* Metrics */}
      <div className="card p-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {detailed ? "All metrics" : "The metrics that matter"}
          </h2>
          {!detailed && (
            <button
              className="text-sm font-semibold text-brand hover:underline"
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
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <EquityChart data={charts.equity} />
        <DrawdownChart data={charts.drawdown} />
        {detailed && <HistogramChart data={charts.histogram} />}
        {detailed && charts.rolling_sharpe?.x?.length > 0 && (
          <RollingSharpeChart data={charts.rolling_sharpe} />
        )}
        {charts.monte_carlo && (
          <div className="lg:col-span-2">
            <MonteCarloChart data={charts.monte_carlo} />
          </div>
        )}
      </div>

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
              <Detail k="Deflated Sharpe" v={pct(sharpe.dsr.dsr)} />
              <Detail k="Luck-implied max SR" v={num(sharpe.dsr.expected_max_sharpe, 3)} />
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
              {sharpe.haircut_sharpe && (
                <Detail k="Haircut" v={pct(sharpe.haircut_sharpe.haircut)} />
              )}
              {monte_carlo && (
                <Detail
                  k="MC percentile"
                  v={`${Math.round(monte_carlo.final_return_percentile)}th`}
                />
              )}
            </div>
            {sharpe.dsr.variance_estimated && (
              <p className="mt-3 text-xs text-slate-500">
                Note: the cross-trial Sharpe variance used for deflation was
                estimated conservatively from this strategy’s own sampling
                variance (the full set of trial Sharpes wasn’t provided).
              </p>
            )}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-slate-500">
        {verdict.disclaimer}
      </p>
    </div>
  );
}

function Detail({ k, v }) {
  return (
    <>
      <span className="text-slate-500">{k}</span>
      <span className="text-right font-mono font-medium">{v}</span>
    </>
  );
}
