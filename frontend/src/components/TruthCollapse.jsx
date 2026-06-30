import { useCallback, useEffect, useRef, useState } from "react";

// Signature interaction — the "truth collapse": an inflated, reported Sharpe and
// return curve deflate in real time to their statistically honest values and
// lock in. Illustrative (not a claim); it shows the product in one motion.
const N = 44;
const REPORTED_SHARPE = 3.18;
const TRUE_SHARPE = 0.41;
const REPORTED_RET = 1.42; // +142%
const TRUE_RET = 0.11; // +11%

const inflated = Array.from({ length: N }, (_, i) => Math.pow(i / (N - 1), 1.8));
const truth = Array.from({ length: N }, (_, i) => {
  const t = i / (N - 1);
  return t * 0.34 + Math.sin(t * 7) * 0.018;
});

const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const lerp = (a, b, t) => a + (b - a) * t;

function path(values, w, h, pad) {
  const span = w - pad * 2;
  return values
    .map((v, i) => {
      const x = pad + (i / (N - 1)) * span;
      const y = h - pad - v * (h - pad * 2);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export default function TruthCollapse() {
  const [t, setT] = useState(0); // 0 = reported, 1 = true
  const raf = useRef(0);
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const run = useCallback(() => {
    if (reduce) {
      setT(1);
      return;
    }
    cancelAnimationFrame(raf.current);
    const DUR = 1700;
    const start = performance.now() + 280; // brief hold on the inflated value
    const tick = (now) => {
      const p = Math.max(0, Math.min(1, (now - start) / DUR));
      setT(easeOut(p));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    setT(0);
    raf.current = requestAnimationFrame(tick);
  }, [reduce]);

  useEffect(() => {
    run();
    return () => cancelAnimationFrame(raf.current);
  }, [run]);

  const W = 360;
  const H = 150;
  const PAD = 14;
  const cur = inflated.map((v, i) => lerp(v, truth[i], t));
  const sharpe = lerp(REPORTED_SHARPE, TRUE_SHARPE, t);
  const ret = lerp(REPORTED_RET, TRUE_RET, t);
  const settled = t > 0.985;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b hairline px-5 py-3">
        <span className="mono-label">Truth Collapse · live deflation</span>
        <span className="rounded-sm border border-ink-edge bg-ink-elevated px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-label text-txt-faint">
          Illustrative
        </span>
      </div>

      <div className="px-5 py-5">
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Reported performance deflating to true performance">
            <defs>
              <linearGradient id="tc-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#58A6FF" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#58A6FF" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* ghost of the reported (inflated) curve */}
            <path d={path(inflated, W, H, PAD)} fill="none" stroke="#E5534B" strokeOpacity={0.28 * (1 - t) + 0.08} strokeWidth="1.4" strokeDasharray="3 4" />
            {/* live curve, deflating */}
            <path d={`${path(cur, W, H, PAD)} L ${W - PAD} ${H - PAD} L ${PAD} ${H - PAD} Z`} fill="url(#tc-fill)" stroke="none" />
            <path
              d={path(cur, W, H, PAD)}
              fill="none"
              stroke={settled ? "#3FB68B" : "#58A6FF"}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Readout label="Sharpe" value={sharpe.toFixed(2)} settled={settled} />
          <Readout label="Annual return" value={`${ret >= 0 ? "+" : ""}${(ret * 100).toFixed(0)}%`} settled={settled} />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="font-mono text-[11px] text-txt-muted">
            {settled ? "Stabilized at true value" : "Deflating…"}
          </span>
          <button
            type="button"
            onClick={run}
            className="font-mono text-[11px] uppercase tracking-label text-data underline-offset-4 hover:underline"
          >
            Re-run deflation
          </button>
        </div>
      </div>
    </div>
  );
}

function Readout({ label, value, settled }) {
  return (
    <div className="rounded-md border border-ink-edge bg-ink-deep/60 px-3 py-2.5">
      <div className="mono-label">{label}</div>
      <div
        className={`mt-1 font-mono text-2xl font-semibold tabular-nums transition-colors ${
          settled ? "text-robust" : "text-txt"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
