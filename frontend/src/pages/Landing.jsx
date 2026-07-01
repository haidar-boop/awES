import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight, ArrowRight, ChartLineUp, Shuffle, Target,
  ListChecks, ShieldCheck, Waveform,
} from "@phosphor-icons/react";
import { fetchSample } from "../lib/api.js";
import { useAnalysis } from "../lib/store.jsx";
import VerdictGauge from "../components/VerdictGauge.jsx";
import Reveal from "../components/Reveal.jsx";

const PROOF = [
  ["1,000", "random strategies raced"],
  ["25 yrs", "of data stress-tested"],
  ["12", "robustness checks"],
  ["0", "promises of profit"],
];

const FEATURES = [
  {
    icon: ListChecks,
    title: "Prioritized Validation Plan",
    body: "The exact next steps for your strategy — read off your own results and ranked critical to minor. Not a score. A to-do list.",
    big: true,
    span: "md:col-span-2 md:row-span-2",
  },
  { icon: Target, title: "Deflated Sharpe", body: "Discounts your Sharpe for every variation you tried — the core anti-data-mining test.", span: "md:col-span-2" },
  { icon: ChartLineUp, title: "Monte Carlo", body: "Thousands of resampled futures, drawn as an outcome cone.", span: "md:col-span-1" },
  { icon: Shuffle, title: "Vs. Random", body: "Races your edge against 1,000 zero-edge strategies.", span: "md:col-span-1" },
];

const PLAN_TIERS = [
  ["Critical", "text-overfit", "bg-overfit"],
  ["Important", "text-caution", "bg-caution"],
  ["Minor", "text-txt-muted", "bg-txt-faint"],
  ["Strength", "text-robust", "bg-robust"],
];

export default function Landing() {
  const nav = useNavigate();
  const { setAnalysis, setRequest } = useAnalysis();
  const [loading, setLoading] = useState(null);

  async function runSample(name) {
    setLoading(name);
    try {
      const s = await fetchSample(name);
      setRequest(null);
      setAnalysis(s.analysis);
      nav("/results");
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-28 md:space-y-40">
      {/* ---- HERO — editorial split ---------------------------------------- */}
      <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div className="motion-safe:animate-reveal">
          <span className="eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-data" />
            Honest backtest auditing
          </span>
          <h1 className="mt-5 font-display text-5xl font-semibold leading-[0.95] tracking-tightest text-txt sm:text-6xl md:text-7xl">
            Your backtest is
            <br />
            <span className="italic text-data">lying</span> to you.
          </h1>
          <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-txt-muted">
            Most stunning backtests lose money live because they’re overfit. Paste
            your results and get one clear, statistical verdict —{" "}
            <span className="text-txt">holds up</span> or{" "}
            <span className="text-txt">likely overfit</span> — from the same tests
            quants use, in plain English.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button className="btn-primary group pl-6 pr-2.5" onClick={() => nav("/analyze")}>
              Analyze my strategy
              <span className="btn-nib" aria-hidden="true">
                <ArrowUpRight size={16} weight="bold" />
              </span>
            </button>
            <button className="btn-ghost" disabled={loading} onClick={() => runSample("overfit")}>
              {loading === "overfit" ? "Loading…" : "See a live report"}
            </button>
          </div>
          <p className="mt-5 max-w-md font-mono text-[11px] uppercase leading-relaxed tracking-eyebrow text-txt-faint">
            No signup · we never call a strategy “profitable” — only whether it
            passes specific checks
          </p>
        </div>

        {/* Live verdict gauge, seated in a double-bezel plate. */}
        <Reveal delay={120} className="relative">
          <div
            className="pointer-events-none absolute -inset-8 -z-10 opacity-70"
            style={{ background: "radial-gradient(30rem 24rem at 60% 30%, rgba(88,166,255,0.14), transparent 65%)" }}
            aria-hidden="true"
          />
          <div className="bezel">
            <div className="bezel-core p-7 sm:p-9">
              <div className="flex items-center justify-between">
                <span className="mono-label">Reality Check</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-caution/10 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-eyebrow text-caution ring-1 ring-caution/30">
                  Verdict · Inconclusive
                </span>
              </div>
              <div className="mt-4 grid place-items-center">
                <VerdictGauge zone={0.5} accent="#D9A441" size={220} />
              </div>
              <dl className="mt-6 divide-y divide-ink-edge/70 border-t border-ink-edge/70">
                {[
                  ["Annualized Sharpe", "0.69"],
                  ["Beats random field", "99.8%"],
                  ["Beats buy & hold", "No"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-2.5">
                    <dt className="text-sm text-txt-muted">{k}</dt>
                    <dd className="font-mono text-sm tabular-nums text-txt">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-eyebrow text-txt-faint">
                Live example · Golden Cross, 25 yrs SPY
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---- PROOF STRIP --------------------------------------------------- */}
      <Reveal as="section" className="grid grid-cols-2 gap-px overflow-hidden rounded-core bg-ink-edge/60 ring-1 ring-ink-edge lg:grid-cols-4">
        {PROOF.map(([n, l]) => (
          <div key={l} className="bg-ink-panel px-6 py-7">
            <div className="font-display text-3xl font-semibold tabular-nums tracking-tight text-txt">{n}</div>
            <div className="mt-1 font-mono text-[11px] uppercase tracking-eyebrow text-txt-faint">{l}</div>
          </div>
        ))}
      </Reveal>

      {/* ---- FEATURE BENTO ------------------------------------------------- */}
      <section>
        <Reveal>
          <span className="eyebrow">The full instrument</span>
          <h2 className="mt-4 max-w-2xl font-display text-4xl font-semibold tracking-tight text-txt">
            Every test a quant fund runs, on your own data.
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-4 md:auto-rows-[minmax(0,1fr)]">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={i * 80} className={f.span}>
                <div className={`card group flex h-full flex-col ${f.big ? "p-8" : "p-6"}`}>
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink-elevated text-data ring-1 ring-ink-edge">
                    <Icon size={f.big ? 24 : 20} weight="light" />
                  </span>
                  <h3 className={`mt-5 font-display font-semibold tracking-tight text-txt ${f.big ? "text-2xl" : "text-lg"}`}>
                    {f.title}
                  </h3>
                  <p className={`mt-2 leading-relaxed text-txt-muted ${f.big ? "max-w-md text-base" : "text-sm"}`}>
                    {f.body}
                  </p>
                  {f.big && (
                    <>
                      <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                        {PLAN_TIERS.map(([label, tone, dot]) => (
                          <div key={label} className="flex items-center gap-2 rounded-lg bg-ink-deep px-3 py-2 ring-1 ring-ink-edge">
                            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                            <span className={`font-mono text-[10px] uppercase tracking-eyebrow ${tone}`}>{label}</span>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => nav("/pro")} className="mt-auto inline-flex items-center gap-1.5 pt-6 font-mono text-[11px] uppercase tracking-eyebrow text-data transition-colors hover:text-txt">
                        See everything in Pro <ArrowRight size={13} weight="bold" />
                      </button>
                    </>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ---- AUTOPSY ZIG-ZAG ---------------------------------------------- */}
      <section className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal className="order-2 lg:order-1">
          <span className="eyebrow">
            <Waveform size={13} weight="bold" /> Backtest autopsy
          </span>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight text-txt">
            The strategy everyone worships,
            <span className="italic text-data"> undressed.</span>
          </h2>
          <p className="mt-4 max-w-[48ch] text-base leading-relaxed text-txt-muted">
            We ran the textbook Golden Cross on 25 years of SPY. It returned +656%
            — and lost to simply holding, which made +678%. All that timing bought
            one thing: a smaller drawdown. A seatbelt, not an engine.
          </p>
          <button className="btn-ghost group mt-7" onClick={() => runSample("overfit")}>
            Run a live report
            <ArrowRight size={15} weight="bold" className="transition-transform duration-500 ease-spatial group-hover:translate-x-0.5" />
          </button>
        </Reveal>

        <Reveal delay={120} className="order-1 lg:order-2">
          <div className="bezel">
            <div className="bezel-core p-7 sm:p-8">
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["Golden Cross", "+656%", "0.69", "-34%", "text-txt"],
                  ["Just holding", "+678%", "0.52", "-55%", "text-txt-muted"],
                ].map(([name, ret, sharpe, dd, tone]) => (
                  <div key={name} className="rounded-xl bg-ink-deep p-5 ring-1 ring-ink-edge">
                    <div className="mono-label">{name}</div>
                    <div className={`mt-2 font-display text-2xl font-semibold tabular-nums tracking-tight ${tone}`}>{ret}</div>
                    <dl className="mt-3 space-y-1.5 font-mono text-[11px] tabular-nums text-txt-muted">
                      <div className="flex justify-between"><dt>Sharpe</dt><dd className="text-txt">{sharpe}</dd></div>
                      <div className="flex justify-between"><dt>Max DD</dt><dd className="text-txt">{dd}</dd></div>
                    </dl>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-caution/10 px-4 py-3 ring-1 ring-caution/25">
                <ShieldCheck size={16} weight="bold" className="text-caution" />
                <span className="text-sm text-txt">Verdict: <span className="text-caution">inconclusive</span> — beats random, not the benchmark.</span>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---- CLOSING CTA --------------------------------------------------- */}
      <Reveal as="section" className="relative overflow-hidden rounded-bezel border border-ink-edge bg-ink-panel px-8 py-16 text-center sm:px-12">
        <div
          className="pointer-events-none absolute inset-0 -z-0 opacity-80"
          style={{ background: "radial-gradient(40rem 22rem at 50% -20%, rgba(88,166,255,0.12), transparent 60%)" }}
          aria-hidden="true"
        />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl font-display text-4xl font-semibold tracking-tight text-txt sm:text-5xl">
            Find out what your backtest is hiding.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-txt-muted">
            One paste. One verdict. No signup to see it.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button className="btn-primary group pl-6 pr-2.5" onClick={() => nav("/analyze")}>
              Analyze my strategy
              <span className="btn-nib" aria-hidden="true"><ArrowUpRight size={16} weight="bold" /></span>
            </button>
            <button className="btn-ghost" disabled={loading} onClick={() => runSample("robust")}>
              {loading === "robust" ? "Loading…" : "Try sample data"}
            </button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
